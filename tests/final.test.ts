import 'dotenv/config';
import {beforeEach,afterAll,it,expect} from 'vitest';
import {db,rows} from '../src/lib/db';
import {execute,reviewData} from '../src/lib/workflow';
import {seed,ids} from '../scripts/seed';
if(new URL(process.env.DATABASE_URL!).pathname!=='/lets_cook_test')throw Error('Disposable test database required');
beforeEach(seed);afterAll(()=>db.$disconnect());
const bid=ids.ready;
async function state(){return (await rows(db,'SELECT * FROM booking WHERE id=$1::uuid',bid))[0];}
async function act(action:string,extra:any={},staff=ids.coordinator){return execute(staff,{bookingId:bid,version:(await state()).version,action,...extra});}
async function review(){await act('feasibility',{reason:'Final inspected seeded evidence'});}
async function approve(){await review();await act('decision',{outcome:'Approved',reason:'Final source and accepted terms reviewed'});}
async function response(text='Please use the north entrance.',material=false){await act('clarify',{reason:'Confirm arrival instructions'});const [c]=await rows(db,'SELECT * FROM clarification_request ORDER BY created_at DESC LIMIT 1');await act('resolve',{recordId:c.id,reason:text,source:'PRIVATE-SOURCE-FINAL',materialChange:material});return c.id;}
async function dispose(recordId:string,extra:any={}){await act('disposition',{recordId,disposition:'ApprovedInstruction',instruction:'Use the north entrance.',materialChange:false,reason:'PRIVATE-REVIEW-FINAL; accepted requirements unchanged',...extra});}
async function instructions(){return rows(db,'SELECT * FROM order_instruction');}
function evidence(id:string,v:any){console.log('FINAL-EVIDENCE '+JSON.stringify({id,observed:v}));}
it('F01 requires response source and explicit disposition, and rejects unauthorized staff',async()=>{
 const c=await response();await review();await expect(act('decision',{outcome:'Approved',reason:'Attempt'})).rejects.toThrow('clarification');
 const v=(await state()).version;
 await expect(execute(ids.kitchen,{bookingId:bid,version:v,action:'disposition',recordId:c,disposition:'Rejected',materialChange:false,reason:'Attempt'})).rejects.toThrow('authority');
 await expect(act('disposition',{recordId:c,disposition:'Rejected',reason:'No assessment'})).rejects.toThrow('assessment');
 expect((await rows(db,'SELECT * FROM clarification_disposition'))).toHaveLength(0);
 await dispose(c);expect((await rows(db,'SELECT * FROM clarification_disposition'))[0].staff_id).toBe(ids.coordinator);
 evidence('F01',{booking:await state(),dispositions:await rows(db,'SELECT * FROM clarification_disposition')});
});
it('F02 snapshots only current approved instruction and hides internal evidence from Kitchen',async()=>{
 const original=await state();const c=await response('PRIVATE-RESPONSE-FINAL: north entrance please.');await dispose(c);
 await dispose(c,{instruction:'Use the south entrance.'});await approve();await act('confirm');
 const k=await reviewData(ids.kitchen);expect(k.bookings).toEqual([]);expect(k.orders[0].instructions).toEqual([{instruction:'Use the south entrance.'}]);
 expect(JSON.stringify(k)).not.toMatch(/PRIVATE-|response_source|review_outcome|unit_price|pricing_details/);
 const b=await state();expect(b.accepted_quote_version_id).toBe(original.accepted_quote_version_id);expect(b.acceptance_id).toBe(original.acceptance_id);
 await expect(act('disposition',{recordId:c,disposition:'Rejected',materialChange:false,reason:'Late change'})).rejects.toThrow('PendingReview');
 await expect(db.$executeRawUnsafe("UPDATE order_instruction SET instruction='replacement'")).rejects.toThrow('immutable');
 await expect(db.$executeRawUnsafe("UPDATE clarification_disposition SET reason='replacement'")).rejects.toThrow('immutable');
 evidence('F02',{kitchen:k,snapshot:await instructions()});
});
it('F03 later disposition and clarification invalidate approved state and stale confirmation',async()=>{
 const c=await response();await dispose(c);await approve();const old=await state();
 await dispose(c,{instruction:'Use the south entrance.'});expect((await state()).status).toBe('PendingReview');
 await expect(execute(ids.coordinator,{bookingId:bid,version:old.version,action:'confirm'})).rejects.toThrow('Record changed');
 await expect(act('decision',{outcome:'Approved',reason:'Old review'})).rejects.toThrow('feasibility');
 await approve();const approved=await state();await act('clarify',{reason:'New instruction question'});
 await expect(execute(ids.coordinator,{bookingId:bid,version:approved.version,action:'confirm'})).rejects.toThrow('Record changed');
 expect((await rows(db,"SELECT * FROM approval_decision WHERE outcome='Approved'"))).toHaveLength(2);expect(await instructions()).toHaveLength(0);
 evidence('F03',{booking:await state(),history:await rows(db,'SELECT * FROM status_event WHERE booking_id=$1::uuid',bid)});
});
it('F04 material changes cannot be approved or dismissed and escalate without rewriting accepted records',async()=>{
 for(const text of ['Change date to July 1','We now have 60 guests','Change menu','Change pricing to $500','New allergies','Change accepted requirements']){
  await seed();const original=await state();const c=await response(text);
  await expect(dispose(c)).rejects.toThrow('Material change');
  await expect(dispose(c,{disposition:'Rejected',instruction:undefined})).rejects.toThrow('Material change');
  await dispose(c,{disposition:'Escalated',instruction:undefined,materialChange:true});
  expect((await state()).status).toBe('Escalated');
  await expect(act('resume',{reason:'Cannot bypass'},ids.manager)).rejects.toThrow('amendment');
  await expect(act('confirm')).rejects.toThrow('approved decision');
  expect((await state()).accepted_quote_version_id).toBe(original.accepted_quote_version_id);expect(await instructions()).toHaveLength(0);
  evidence('F04',{response:text,status:(await state()).status});
 }
});
it('F05 declared uncertainty escalates even without keywords; rejected instructions never enter snapshot',async()=>{
 const c=await response('Please change it as discussed.',true);await expect(dispose(c)).rejects.toThrow('Material change');
 await dispose(c,{disposition:'Escalated',instruction:undefined,materialChange:true});expect((await state()).status).toBe('Escalated');
 await seed();const rejected=await response();await dispose(rejected,{disposition:'Rejected',instruction:undefined});await approve();await act('confirm');expect(await instructions()).toHaveLength(0);evidence('F05',{rejectedSnapshot:await instructions()});
});
it('F06 concurrent confirmations atomically create one instruction snapshot and one order',async()=>{
 const c=await response();await dispose(c);await approve();const v=(await state()).version;const cmd={bookingId:bid,version:v,action:'confirm'};
 const result=await Promise.all(Array.from({length:6},()=>execute(ids.coordinator,cmd)));result.push(await execute(ids.coordinator,cmd));
 expect(new Set(result.map((r:any)=>r.orderId)).size).toBe(1);expect(await instructions()).toHaveLength(1);expect((await rows(db,'SELECT * FROM catering_order'))).toHaveLength(1);
 expect((await rows(db,"SELECT * FROM status_event WHERE new_status='Confirmed'"))).toHaveLength(1);evidence('F06',{results:result,snapshot:await instructions()});
});
it('F07 injected instruction insertion failure rolls back order, lines, status and history',async()=>{
 const c=await response();await dispose(c);await approve();
 await db.$executeRawUnsafe("CREATE FUNCTION final_inject_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected snapshot failure'; END $$");
 await db.$executeRawUnsafe('CREATE TRIGGER final_failure BEFORE INSERT ON order_instruction FOR EACH ROW EXECUTE FUNCTION final_inject_failure()');
 try{await expect(act('confirm')).rejects.toThrow('injected snapshot failure');expect((await state()).status).toBe('Approved');expect(await instructions()).toHaveLength(0);expect((await rows(db,'SELECT * FROM catering_order'))).toHaveLength(0);expect((await rows(db,'SELECT * FROM order_line'))).toHaveLength(0);expect((await rows(db,"SELECT * FROM status_event WHERE new_status='Confirmed'"))).toHaveLength(0);}
 finally{await db.$executeRawUnsafe('DROP TRIGGER final_failure ON order_instruction');await db.$executeRawUnsafe('DROP FUNCTION final_inject_failure()');}
 await act('confirm');expect(await instructions()).toHaveLength(1);evidence('F07',{retestStatus:(await state()).status,snapshot:await instructions()});
});
it('F08 instruction changes cannot bypass existing scheduling and allergy findings',async()=>{
 for(const bookingId of [ids.conflict,ids.missing]){
  const [b]=await rows(db,'SELECT * FROM booking WHERE id=$1::uuid',bookingId);
  await execute(ids.coordinator,{bookingId,version:b.version,action:'feasibility',reason:'Final unchanged blocker'});
  const [current]=await rows(db,'SELECT * FROM booking WHERE id=$1::uuid',bookingId);
  await expect(execute(ids.coordinator,{bookingId,version:current.version,action:'decision',outcome:'Approved',reason:'Cannot clear with instructions'})).rejects.toThrow('feasibility');
 }
 evidence('F08',{orders:await rows(db,'SELECT * FROM catering_order')});
});
it('F09 rejects nonallowlisted instructions, empty source and edits to recorded response',async()=>{
 await act('clarify',{reason:'Arrival question'});const [c]=await rows(db,'SELECT * FROM clarification_request');
 await expect(act('resolve',{recordId:c.id,reason:'North entrance'})).rejects.toThrow('source');
 await act('resolve',{recordId:c.id,reason:'North entrance',source:'Internal email FINAL-9'});
 await expect(dispose(c.id,{instruction:'Change menu and charge $500'})).rejects.toThrow();
 await expect(db.$executeRawUnsafe("UPDATE clarification_request SET response='replacement' WHERE id=$1::uuid",c.id)).rejects.toThrow('immutable');
 await dispose(c.id);evidence('F09',{dispositions:await rows(db,'SELECT * FROM clarification_disposition')});
});
it('F10 history failure after snapshot insertion rolls back the complete confirmation',async()=>{
 const c=await response();await dispose(c);await approve();
 await db.$executeRawUnsafe("CREATE FUNCTION final_history_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.new_status='Confirmed' THEN RAISE EXCEPTION 'final history failure'; END IF; RETURN NEW; END $$");
 await db.$executeRawUnsafe('CREATE TRIGGER final_history_failure BEFORE INSERT ON status_event FOR EACH ROW EXECUTE FUNCTION final_history_failure()');
 try{await expect(act('confirm')).rejects.toThrow('final history failure');expect(await instructions()).toHaveLength(0);expect((await rows(db,'SELECT * FROM catering_order'))).toHaveLength(0);expect((await state()).status).toBe('Approved');}
 finally{await db.$executeRawUnsafe('DROP TRIGGER final_history_failure ON status_event');await db.$executeRawUnsafe('DROP FUNCTION final_history_failure()');}
 await act('confirm');expect(await instructions()).toHaveLength(1);evidence('F10',{snapshot:await instructions()});
});
it('F11 simultaneous disposition and confirmation serialize to a coherent snapshot or renewed review',async()=>{
 const c=await response();await dispose(c);await approve();const v=(await state()).version;
 const results=await Promise.allSettled([execute(ids.coordinator,{bookingId:bid,version:v,action:'disposition',recordId:c,disposition:'Rejected',materialChange:false,reason:'Later review rejects extra instruction'}),execute(ids.coordinator,{bookingId:bid,version:v,action:'confirm'})]);
 const b=await state();if(b.status==='Confirmed'){expect(await instructions()).toHaveLength(1);expect(results[0].status).toBe('rejected');}else{expect(b.status).toBe('PendingReview');expect(await instructions()).toHaveLength(0);expect(results[1].status).toBe('rejected');}
 evidence('F11',{status:b.status,results:results.map(r=>r.status),snapshot:await instructions()});
});
