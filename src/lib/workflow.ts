import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, DB, rows } from './db';
export class WorkflowError extends Error { constructor(message:string,public status=409){super(message);} }
const id=z.string().uuid();
const commandSchema=z.object({bookingId:id,version:z.number().int().nonnegative(),action:z.enum(['feasibility','decision','confirm','clarify','resolve','resume','ai','aiReview']),reason:z.string().trim().max(4000).optional(),outcome:z.enum(['Approved','Rejected','Escalated']).optional(),recordId:id.optional(),review:z.enum(['Accepted','Modified','Rejected']).optional(),simulateFailure:z.boolean().optional()});
export type Command=z.infer<typeof commandSchema>;
export async function staffContext(tx:DB, staffId:string) {
 const [s]=await rows(tx,'SELECT id,name,email,role,active FROM staff_member WHERE id=$1::uuid',id.parse(staffId));
 if(!s?.active) throw new WorkflowError('Active staff session required.',403); return s;
}
async function event(tx:DB,b:any,staff:string,next:string,reason:string,decision:string|null=null){
 await tx.$executeRawUnsafe('INSERT INTO status_event(id,booking_id,previous_status,new_status,actor_id,reason,decision_id) VALUES($1::uuid,$2::uuid,$3,$4,$5::uuid,$6,$7::uuid)',randomUUID(),b.id,b.status,next,staff,reason,decision);
}
export async function reviewData(staffId:string){
 const s=await staffContext(db,staffId);
 if(s.role==='Kitchen') return {staff:s,bookings:[],orders:await handoffs()};
 const bookings=await rows(db,`SELECT b.*,c.name AS customer_name,i.original_text,i.event_date,i.event_type,i.event_location,i.guest_count,i.service_type,i.dietary_restrictions,i.special_requests,q.version_number,q.pricing_details,q.terms,q.currency,q.total,q.expires_at,a.accepted_at,a.method,a.source FROM booking b JOIN customer c ON c.id=b.customer_id JOIN inquiry i ON i.id=b.inquiry_id JOIN quote_version q ON q.id=b.accepted_quote_version_id JOIN quote_acceptance a ON a.id=b.acceptance_id ORDER BY b.created_at,b.id`);
 for(const b of bookings){
  b.decisions=await rows(db,'SELECT d.*,s.name AS staff_name FROM approval_decision d JOIN staff_member s ON s.id=d.staff_id WHERE booking_id=$1::uuid ORDER BY created_at,id',b.id);
  b.history=await rows(db,'SELECT e.*,s.name AS staff_name FROM status_event e JOIN staff_member s ON s.id=e.actor_id WHERE booking_id=$1::uuid ORDER BY created_at,id',b.id);
  b.feasibility=await rows(db,'SELECT f.*,s.name AS reviewer_name FROM feasibility_review f LEFT JOIN staff_member s ON s.id=f.reviewed_by WHERE booking_id=$1::uuid',b.id);
  b.feasibilityHistory=await rows(db,'SELECT f.*,s.name AS staff_name FROM feasibility_acknowledgement f JOIN staff_member s ON s.id=f.staff_id WHERE booking_id=$1::uuid ORDER BY created_at',b.id);
  b.clarifications=await rows(db,'SELECT * FROM clarification_request WHERE booking_id=$1::uuid ORDER BY created_at',b.id);
  b.analyses=await rows(db,'SELECT * FROM ai_analysis WHERE inquiry_id=$1::uuid ORDER BY created_at',b.inquiry_id);
  b.quoteHistory=await rows(db,'SELECT id,version_number,terms,total,created_at FROM quote_version WHERE inquiry_id=$1::uuid ORDER BY version_number',b.inquiry_id);
 }
 return {staff:s,bookings,orders:await handoffs()};
}
async function handoffs(){return rows(db,`SELECT o.id,o.booking_id,o.status,b.accepted_quote_version_id,i.event_date,i.event_location,i.guest_count,i.service_type,i.dietary_restrictions,i.special_requests FROM catering_order o JOIN booking b ON b.id=o.booking_id JOIN inquiry i ON i.id=b.inquiry_id WHERE b.status='Confirmed' ORDER BY o.created_at DESC`).then(async orders=>{for(const o of orders)o.lines=await rows(db,'SELECT description,quantity FROM order_line WHERE order_id=$1::uuid',o.id);return orders;});}
async function prerequisites(tx:DB,b:any,approved=false){
 const [i]=await rows(tx,'SELECT * FROM inquiry WHERE id=$1::uuid',b.inquiry_id);
 const [q]=await rows(tx,`SELECT q.*,a.accepted_at FROM quote_version q JOIN quote_acceptance a ON a.quote_version_id=q.id WHERE a.id=$1::uuid AND q.id=$2::uuid AND q.inquiry_id=$3::uuid`,b.acceptance_id,b.accepted_quote_version_id,b.inquiry_id);
 if(!i?.event_location?.trim()||!i.event_type?.trim()||!i.service_type?.trim()||i.guest_count<=0)throw new WorkflowError('Required event information is missing.');
 if(new Date(i.event_date).toISOString().slice(0,10)<new Date().toISOString().slice(0,10))throw new WorkflowError('Event date is in the past.');
 if(!q||new Date(q.expires_at)<=new Date()||new Date(q.accepted_at)>new Date(q.expires_at)||new Date(q.accepted_at)>new Date())throw new WorkflowError('Accepted quote is expired or acceptance evidence is invalid.');
 const [f]=await rows(tx,'SELECT * FROM feasibility_review WHERE booking_id=$1::uuid',b.id);
 const evidenceVersion=approved?b.version-1:b.version;
 if(!f?.reviewed_by || f.booking_version!==evidenceVersion || f.scheduling!=='Clear'||f.capacity!=='Clear'||f.missing_information.length)throw new WorkflowError('Staff-reviewed demonstration feasibility evidence must be current, complete, and clear.');
 const open=await rows(tx,'SELECT id FROM clarification_request WHERE booking_id=$1::uuid AND resolved_at IS NULL',b.id);
 if(open.length)throw new WorkflowError('Resolve outstanding clarification before approval or confirmation.');
 const lines=z.array(z.object({description:z.string().trim().min(1),quantity:z.number().int().positive(),unitPriceCents:z.number().int().nonnegative().max(1000000000)})).min(1).parse(q.pricing_details);
 const cents=lines.reduce((sum,l)=>sum+l.quantity*l.unitPriceCents,0);
 if(!Number.isSafeInteger(cents)||cents!==Math.round(Number(q.total)*100)||Number(q.subtotal)!==Number(q.total))throw new WorkflowError('Quote lines do not match accepted commercial totals.');
 return lines;
}
export async function execute(staffId:string,input:unknown){
 const cmd=commandSchema.parse(input);
 return db.$transaction(async tx=>{
  const s=await staffContext(tx,staffId);
  if(!['Coordinator','Manager'].includes(s.role))throw new WorkflowError('Booking review authority required.',403);
  const [b]=await rows(tx,'SELECT * FROM booking WHERE id=$1::uuid FOR UPDATE',cmd.bookingId);
  if(!b)throw new WorkflowError('Booking not found.',404);
  if(cmd.action==='confirm' && b.status==='Confirmed') {const [o]=await rows(tx,'SELECT id FROM catering_order WHERE booking_id=$1::uuid',b.id);return {message:'Already confirmed; existing order opened.',orderId:o.id};}
  if(b.version!==cmd.version)throw new WorkflowError('Record changed. Refresh and review again.');
  const reason=()=>{if(!cmd.reason?.trim())throw new WorkflowError('A nonblank reason or evidence note is required.',400);return cmd.reason;};
  if(cmd.action==='ai'){
   if(process.env.AI_MODE==='unavailable'||cmd.simulateFailure)throw new WorkflowError('Simulated AI unavailable. Manual review remains available.',503);
   const [i]=await rows(tx,'SELECT original_text FROM inquiry WHERE id=$1::uuid',b.inquiry_id);
   const output={label:'SIMULATED advisory output — not a production model',suggestions:[/allerg/i.test(i.original_text)?'Ask the customer to clarify allergy details; no safety guarantee is implied.':'Consider asking whether there are additional dietary or service instructions.'],authority:'No booking authority; compare with original source.'};
   await tx.$executeRawUnsafe("INSERT INTO ai_analysis(id,inquiry_id,source_reference,generated_output,model_identifier,review_status) VALUES($1::uuid,$2::uuid,$3,$4::jsonb,'simulated-advisor-v1','Proposed')",randomUUID(),b.inquiry_id,`Inquiry ${b.inquiry_id}: immutable original_text`,JSON.stringify(output));
   return {message:'Simulated advisory proposal saved. No official booking data changed.'};
  }
  if(cmd.action==='aiReview'){
   if(!cmd.recordId||!cmd.review)throw new WorkflowError('Analysis and review outcome required.',400);
   const n=await tx.$executeRawUnsafe("UPDATE ai_analysis SET review_status=$1,reviewer_id=$2::uuid,reviewed_at=now(),review_outcome=$3 WHERE id=$4::uuid AND inquiry_id=$5::uuid AND review_status='Proposed'",cmd.review,s.id,reason(),cmd.recordId,b.inquiry_id);
   if(n!==1)throw new WorkflowError('Proposal already reviewed or not part of this inquiry.');
   return {message:'AI review recorded separately from booking authorization.'};
  }
  if(cmd.action==='resume'){
   if(s.role!=='Manager'||b.status!=='Escalated')throw new WorkflowError('Only a manager can return an escalated booking to review.',403);
   await event(tx,b,s.id,'PendingReview',reason());
   await tx.$executeRawUnsafe("UPDATE booking SET status='PendingReview',version=version+1 WHERE id=$1::uuid",b.id);
   return {message:'Escalation resolution recorded. Renew feasibility review before deciding.'};
  }
  if(cmd.action==='confirm'){
   if(b.status!=='Approved')throw new WorkflowError('An approved decision is required before confirmation.');
   const [d]=await rows(tx,"SELECT * FROM approval_decision WHERE booking_id=$1::uuid AND outcome='Approved' AND booking_version=$2",b.id,b.version-1);
   if(!d)throw new WorkflowError('Current approval evidence is missing.');
   const lines=await prerequisites(tx,b,true);
   const orderId=randomUUID();
   await tx.$executeRawUnsafe("INSERT INTO catering_order(id,booking_id,status) VALUES($1::uuid,$2::uuid,'Created')",orderId,b.id);
   for(const l of lines)await tx.$executeRawUnsafe('INSERT INTO order_line(id,order_id,description,quantity,unit_price,line_total) VALUES($1::uuid,$2::uuid,$3,$4,$5::numeric,$6::numeric)',randomUUID(),orderId,l.description,l.quantity,(l.unitPriceCents/100).toFixed(2),(l.quantity*l.unitPriceCents/100).toFixed(2));
   await event(tx,b,s.id,'Confirmed','Separate staff confirmation of recorded approval',d.id);
   await tx.$executeRawUnsafe("UPDATE booking SET status='Confirmed',version=version+1,confirmed_at=now() WHERE id=$1::uuid",b.id);
   return {message:'Booking confirmed. One operational order created.',orderId};
  }
  if(b.status!=='PendingReview')throw new WorkflowError('This action requires PendingReview.');
  if(cmd.action==='feasibility'){
   const n=await tx.$executeRawUnsafe('UPDATE feasibility_review SET reviewed_by=$1::uuid,reviewed_at=now(),booking_version=$2,notes=$3 WHERE booking_id=$4::uuid',s.id,b.version+1,reason(),b.id);
   if(n!==1)throw new WorkflowError('Demonstration evidence unavailable.');
   await tx.$executeRawUnsafe('INSERT INTO feasibility_acknowledgement(id,booking_id,staff_id,booking_version,notes) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5)',randomUUID(),b.id,s.id,b.version+1,cmd.reason!);
  }else if(cmd.action==='clarify'){
   await tx.$executeRawUnsafe('INSERT INTO clarification_request(id,booking_id,question,staff_id) VALUES($1::uuid,$2::uuid,$3,$4::uuid)',randomUUID(),b.id,reason(),s.id);
  }else if(cmd.action==='resolve'){
   if(!cmd.recordId)throw new WorkflowError('Clarification reference required.',400);
   const n=await tx.$executeRawUnsafe('UPDATE clarification_request SET response=$1,resolved_by=$2::uuid,resolved_at=now() WHERE id=$3::uuid AND booking_id=$4::uuid AND resolved_at IS NULL',reason(),s.id,cmd.recordId,b.id);
   if(n!==1)throw new WorkflowError('Open clarification not found.');
  }else if(cmd.action==='decision'){
   if(!cmd.outcome)throw new WorkflowError('Decision outcome required.',400);
   const explanation=reason();
   if(cmd.outcome==='Approved')await prerequisites(tx,b);
   const decisionId=randomUUID();
   await tx.$executeRawUnsafe('INSERT INTO approval_decision(id,booking_id,staff_id,outcome,reason,booking_version) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6)',decisionId,b.id,s.id,cmd.outcome,explanation,b.version);
   await event(tx,b,s.id,cmd.outcome,explanation,decisionId);
   await tx.$executeRawUnsafe('UPDATE booking SET status=$1,version=version+1 WHERE id=$2::uuid',cmd.outcome,b.id);
   return {message:`${cmd.outcome} decision recorded. Confirmation is a separate action.`};
  }
  await tx.$executeRawUnsafe('UPDATE booking SET version=version+1 WHERE id=$1::uuid',b.id);
  return {message:'Review evidence saved. Review current evidence before deciding.'};
 },{timeout:15000});
}
