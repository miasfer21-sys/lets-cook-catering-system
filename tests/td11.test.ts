import 'dotenv/config';
import {beforeEach,afterAll,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {db,rows} from '../src/lib/db';
import {execute,reviewData} from '../src/lib/workflow';
import {seed,ids} from '../scripts/seed';
if(new URL(process.env.DATABASE_URL!).pathname!=='/lets_cook_test')throw Error('Disposable test database required');
beforeEach(seed);afterAll(()=>db.$disconnect());
const bid=ids.ready;
async function state(id=bid){return (await rows(db,'SELECT * FROM booking WHERE id=$1::uuid',id))[0];}
async function act(action:string,extra:any={},id=bid,staff=ids.coordinator){return execute(staff,{bookingId:id,version:(await state(id)).version,action,...extra});}
async function review(id=bid){await act('feasibility',{reason:'TD11 inspected seeded calendar and roster'},id);}
async function approve(){await review();await act('decision',{outcome:'Approved',reason:'TD11 checked source, acceptance and feasibility'});}
async function snapshot(id=bid){return {booking:await state(id),orders:await rows(db,'SELECT * FROM catering_order WHERE booking_id=$1::uuid',id),decisions:await rows(db,'SELECT * FROM approval_decision WHERE booking_id=$1::uuid',id),history:await rows(db,'SELECT * FROM status_event WHERE booking_id=$1::uuid ORDER BY created_at',id)};}
function evidence(id:string,value:any){console.log('TD11-EVIDENCE '+JSON.stringify({id,observed:value}));}
it('TD11-01 normal booking preserves separate approval and confirmed handoff',async()=>{
 await approve();const approved=await snapshot();expect(approved.booking.status).toBe('Approved');expect(approved.orders).toHaveLength(0);
 const result=await act('confirm');const confirmed=await snapshot();const kitchen=await reviewData(ids.kitchen);
 expect(confirmed.booking.status).toBe('Confirmed');expect(confirmed.orders).toHaveLength(1);expect(kitchen.orders[0].lines).toEqual([{description:'Vegetarian buffet',quantity:30}]);
 evidence('TD11-01',{approved,confirmed,result,kitchen});
});
it('TD11-02 unresolved conflict blocks approval and confirmation; escalation is accountable',async()=>{
 await review(ids.conflict);await expect(act('decision',{outcome:'Approved',reason:'Attempt bypass'},ids.conflict)).rejects.toThrow('feasibility');
 await act('decision',{outcome:'Escalated',reason:'TD11 calendar conflict unresolved'},ids.conflict);
 await expect(act('confirm',{},ids.conflict)).rejects.toThrow('approved decision');const actual=await snapshot(ids.conflict);expect(actual.orders).toHaveLength(0);evidence('TD11-02',actual);
});
it('TD11-03 missing allergy information and open clarification remain blockers',async()=>{
 await review(ids.missing);await expect(act('decision',{outcome:'Approved',reason:'Attempt'},ids.missing)).rejects.toThrow('feasibility');
 await act('clarify',{reason:'TD11 confirm dietary instructions'});await review();await expect(act('decision',{outcome:'Approved',reason:'Attempt'})).rejects.toThrow('clarification');
 evidence('TD11-03',{missing:await snapshot(ids.missing),open:await rows(db,'SELECT * FROM clarification_request'),ready:await snapshot()});
});
it('TD11-04 kitchen approval attempt is denied with no mutation',async()=>{
 const before=await snapshot();let error:any;try{await act('decision',{outcome:'Approved',reason:'Forged kitchen decision'},bid,ids.kitchen);}catch(e){error=e;}
 expect(error.status).toBe(403);expect(await snapshot()).toEqual(before);evidence('TD11-04',{error:{message:error.message,status:error.status},after:await snapshot()});
});
it('TD11-05 concurrent and repeated confirmation use the same order',async()=>{
 await approve();const cmd={bookingId:bid,version:(await state()).version,action:'confirm'};
 const results=await Promise.all(Array.from({length:6},()=>execute(ids.coordinator,cmd)));results.push(await execute(ids.coordinator,cmd));
 expect(new Set(results.map((x:any)=>x.orderId)).size).toBe(1);const actual=await snapshot();expect(actual.orders).toHaveLength(1);expect(actual.history.filter((x:any)=>x.new_status==='Confirmed')).toHaveLength(1);evidence('TD11-05',{results,actual});
});
it('TD11-06 persistent AI outage preserves manual controls and source records',async()=>{
 const original=await state();await act('ai');const old=process.env.AI_MODE;process.env.AI_MODE='unavailable';
 try{await expect(act('ai')).rejects.toThrow('Manual review');expect(await state()).toEqual(original);
 await expect(act('decision',{outcome:'Approved',reason:'Outage is not approval'})).rejects.toThrow('feasibility');
 await approve();await act('confirm');evidence('TD11-06',{actual:await snapshot(),analysis:await rows(db,'SELECT * FROM ai_analysis')});}finally{if(old===undefined)delete process.env.AI_MODE;else process.env.AI_MODE=old;}
});
it('TD11-07 exact accepted v2 survives later unaccepted v3; mismatched acceptance fails',async()=>{
 const b=await state();const [q]=await rows(db,'SELECT * FROM quote_version WHERE id=$1::uuid',b.accepted_quote_version_id);
 const v3=randomUUID();await db.$executeRawUnsafe("INSERT INTO quote_version(id,quote_id,inquiry_id,version_number,pricing_details,terms,currency,subtotal,total,expires_at) VALUES($1::uuid,$2::uuid,$3::uuid,3,$4::jsonb,'TD11 unaccepted revision','USD',900,900,'2030-06-01')",v3,q.quote_id,q.inquiry_id,JSON.stringify([{description:'Unaccepted menu',quantity:30,unitPriceCents:3000}]));
 await expect(db.$executeRawUnsafe('UPDATE booking SET accepted_quote_version_id=$1::uuid WHERE id=$2::uuid',v3,bid)).rejects.toThrow();
 await expect(db.$executeRawUnsafe("UPDATE quote_acceptance SET source='replacement' WHERE id=$1::uuid",b.acceptance_id)).rejects.toThrow('immutable');
 await approve();await act('confirm');const data=await reviewData(ids.coordinator);const actual=data.bookings.find(x=>x.id===bid)!;
 expect(actual.version_number).toBe(2);expect(actual.quoteHistory.map((x:any)=>x.version_number)).toEqual([1,2,3]);expect(data.orders[0].accepted_quote_version_id).toBe(q.id);
 const lines=await rows(db,'SELECT * FROM order_line');expect(Number(lines[0].line_total)).toBe(750);expect(lines[0].description).toBe('Vegetarian buffet');evidence('TD11-07',{acceptedVersion:q.id,acceptanceId:b.acceptance_id,quoteHistory:actual.quoteHistory,order:data.orders,lines});
});
it('TD11-08 changed clarification response invalidates previous feasibility acknowledgement',async()=>{
 await act('clarify',{reason:'TD11 confirm service instructions'});const [c]=await rows(db,'SELECT * FROM clarification_request');await review();const previous=await state();
 await act('resolve',{recordId:c.id,reason:'TD11 customer: use north entrance; fictional email TD11-REPLY-8'});
 await expect(act('decision',{outcome:'Approved',reason:'Attempt stale review'})).rejects.toThrow('feasibility');
 const [f]=await rows(db,'SELECT * FROM feasibility_review WHERE booking_id=$1::uuid',bid);expect(f.booking_version).toBe(previous.version);expect((await state()).version).toBe(previous.version+1);
 await approve();await act('confirm');evidence('TD11-08',{priorReviewVersion:f.booking_version,after:await snapshot(),clarification:await rows(db,'SELECT * FROM clarification_request')});
});
