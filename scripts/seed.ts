import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/password';
export const ids={coordinator:'10000000-0000-4000-8000-000000000001',manager:'10000000-0000-4000-8000-000000000002',kitchen:'10000000-0000-4000-8000-000000000003',ready:'20000000-0000-4000-8000-000000000001',conflict:'20000000-0000-4000-8000-000000000002',missing:'20000000-0000-4000-8000-000000000003'};
export async function seed(){
 if(!process.env.DEMO_PASSWORD||process.env.DEMO_PASSWORD.length<12)throw new Error('Set DEMO_PASSWORD (at least 12 characters).');
 if(!/lets_cook(?:_test)?(?:\?|$)/.test(process.env.DATABASE_URL||''))throw new Error('Seed is restricted to lets_cook or lets_cook_test databases.');
 await db.$transaction(async tx=>{
  // Explicit reset of fictional demo records; TRUNCATE does not invoke immutable-row triggers.
  await tx.$executeRawUnsafe('TRUNCATE feasibility_acknowledgement,ai_analysis,status_event,order_line,catering_order,approval_decision,clarification_request,feasibility_review,booking,quote_acceptance,quote_version,quote,inquiry,customer,staff_member CASCADE');
  for(const [key,role,name] of [['coordinator','Coordinator','Alex Rivera'],['manager','Manager','Morgan Lee'],['kitchen','Kitchen','Jamie Chen']])await tx.$executeRawUnsafe('INSERT INTO staff_member(id,email,name,role,password_hash) VALUES($1::uuid,$2,$3,$4,$5)',ids[key as keyof typeof ids],`${key}@demo.local`,name,role,hashPassword(process.env.DEMO_PASSWORD!));
  let n=0;
  for(const bid of [ids.ready,ids.conflict,ids.missing]){
   n++;
   const customer=randomUUID(),inquiry=randomUUID(),quote=randomUUID(),version=randomUUID(),acceptance=randomUUID();
   const names=['Willow Arts Workshop','Harbor Community Lunch','Maple Studio Gathering'];
   await tx.$executeRawUnsafe('INSERT INTO customer(id,name,email) VALUES($1::uuid,$2,$3)',customer,names[n-1],`fictional${n}@example.test`);
   const original=`Fictional demonstration request: ${names[n-1]} would like a buffet for 30 guests at ${['Willow Hall, 12 Example Lane','Harbor Room, 24 Example Road','Maple Studio, 36 Example Avenue'][n-1]}. Vegetarian options requested.${n===3?' Allergy details to follow.':''}`;
   await tx.$executeRawUnsafe("INSERT INTO inquiry(id,customer_id,original_text,event_date,event_type,event_location,guest_count,service_type,dietary_restrictions,special_requests) VALUES($1::uuid,$2::uuid,$3,'2030-06-15','Community event',$4,30,'Buffet','Customer requests vegetarian options; not safety certified.','Fictional demonstration only')",inquiry,customer,original,['Willow Hall, 12 Example Lane','Harbor Room, 24 Example Road','Maple Studio, 36 Example Avenue'][n-1]);
   await tx.$executeRawUnsafe('INSERT INTO quote(id,inquiry_id) VALUES($1::uuid,$2::uuid)',quote,inquiry);
   for(const v of [1,2])await tx.$executeRawUnsafe("INSERT INTO quote_version(id,quote_id,inquiry_id,version_number,pricing_details,terms,currency,subtotal,total,expires_at) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5::jsonb,$6,'USD',$7::numeric,$7::numeric,'2030-06-01')",v===2?version:randomUUID(),quote,inquiry,v,JSON.stringify([{description:'Vegetarian buffet',quantity:30,unitPriceCents:v===2?2500:2700}]),`Fictional offer v${v}. Buffet service included. No tax/discount in Build 1 fixtures.`,v===2?'750.00':'810.00');
   await tx.$executeRawUnsafe("INSERT INTO quote_acceptance(id,quote_version_id,inquiry_id,accepted_at,method,source) VALUES($1::uuid,$2::uuid,$3::uuid,now(),'Recorded customer email (fictional)','Demo fixture email DEMO-ACCEPT-'||$4)",acceptance,version,inquiry,String(n));
   await tx.$executeRawUnsafe("INSERT INTO booking(id,customer_id,inquiry_id,accepted_quote_version_id,acceptance_id,status) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::uuid,'PendingReview')",bid,customer,inquiry,version,acceptance);
   await tx.$executeRawUnsafe("INSERT INTO feasibility_review(id,booking_id,source,demonstration,scheduling,capacity,missing_information,notes) VALUES($1::uuid,$2::uuid,'SEEDED DEMO roster and calendar; no live scheduling integration',true,$3,'Clear',$4::text[],'Unreviewed demonstration evidence — staff must inspect and acknowledge.')",randomUUID(),bid,n===2?'Conflict':'Clear',n===3?['Customer allergy details outstanding']:[]);
   for(const [prev,next] of [[null,'Proposed'],['Proposed','PendingReview']])await tx.$executeRawUnsafe('INSERT INTO status_event(id,booking_id,previous_status,new_status,actor_id,reason,created_at) VALUES($1::uuid,$2::uuid,$3,$4,$5::uuid,$6,clock_timestamp())',randomUUID(),bid,prev,next,ids.coordinator,'Seeded fictional intake and acceptance for Build 1 demonstration');
  }
 });
}
if(process.argv[1]?.endsWith('seed.ts'))seed().then(()=>console.log('Fictional demo data reset and seeded.')).finally(()=>db.$disconnect());
