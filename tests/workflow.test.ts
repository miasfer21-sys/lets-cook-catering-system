import 'dotenv/config';
import {beforeEach,afterAll,describe,it,expect,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {db,rows} from '../src/lib/db';
import {execute,reviewData} from '../src/lib/workflow';
import {seed,ids} from '../scripts/seed';
// Never reset the running demo database: test execution requires a separate database.
if(!process.env.DATABASE_URL?.includes('/lets_cook_test'))throw new Error('Tests require DATABASE_URL ending in /lets_cook_test.');
const staff=ids.coordinator,bid=ids.ready;
async function version(bookingId=bid){return (await rows(db,'SELECT version FROM booking WHERE id=$1::uuid',bookingId))[0].version;}
async function action(action:string,extra:any={},bookingId=bid){return execute(staff,{bookingId,version:await version(bookingId),action,...extra});}
async function approve(){await action('feasibility',{reason:'Inspected seeded roster/calendar. Both clear; no live service.'});await action('decision',{outcome:'Approved',reason:'Source, acceptance and demonstration evidence reviewed.'});}
beforeEach(seed);
afterAll(()=>db.$disconnect());
describe('PostgreSQL workflow integrity',()=>{
 it('requires current staff-reviewed evidence and separate approval',async()=>{
  await expect(action('confirm')).rejects.toThrow('approved decision');
  await expect(action('decision',{outcome:'Approved',reason:'Reviewed'})).rejects.toThrow('feasibility');
  await approve();expect((await rows(db,'SELECT * FROM catering_order')).length).toBe(0);
  await action('confirm');expect((await rows(db,'SELECT * FROM catering_order')).length).toBe(1);
  const data=await reviewData(staff);const b=data.bookings.find(b=>b.id===bid)!;
  expect(b.status).toBe('Confirmed');expect(b.original_text).toContain('Fictional');expect(b.version_number).toBe(2);expect(b.method).toContain('email');
  expect(b.history.map((x:any)=>x.new_status)).toContain('Approved');expect(b.history.map((x:any)=>x.new_status)).toContain('Confirmed');
 });
 it('denies kitchen and inactive staff server-side',async()=>{
  await expect(execute(ids.kitchen,{bookingId:bid,version:0,action:'confirm'})).rejects.toThrow('authority');
  await db.$executeRawUnsafe('UPDATE staff_member SET active=false WHERE id=$1::uuid',staff);
  await expect(action('decision',{outcome:'Rejected',reason:'No'})).rejects.toThrow('Active staff');
 });
 it('rejects blank reasons and stale updates',async()=>{
  await expect(action('decision',{outcome:'Rejected',reason:'   '})).rejects.toThrow('nonblank');
  await action('feasibility',{reason:'Reviewed'});
  await expect(execute(staff,{bookingId:bid,version:0,action:'decision',outcome:'Rejected',reason:'Old review'})).rejects.toThrow('Record changed');
 });
 it('blocks conflicts and missing information even after staff acknowledgement',async()=>{
  for(const bookingId of [ids.conflict,ids.missing]){
   await action('feasibility',{reason:'Inspected seeded evidence'},bookingId);
   await expect(action('decision',{outcome:'Approved',reason:'Cannot bypass'},bookingId)).rejects.toThrow('feasibility');
  }
 });
 it('keeps rejection/escalation non-operational and requires manager escalation resolution',async()=>{
  await action('decision',{outcome:'Rejected',reason:'Customer requirements not supported'});
  await expect(action('confirm')).rejects.toThrow('approved decision');
  await action('decision',{outcome:'Escalated',reason:'Calendar conflict'},ids.conflict);
  await expect(action('resume',{reason:'Attempt'},ids.conflict)).rejects.toThrow('manager');
  await execute(ids.manager,{bookingId:ids.conflict,version:await version(ids.conflict),action:'resume',reason:'Review source again; conflict remains blocking'});
  expect((await rows(db,'SELECT status FROM booking WHERE id=$1::uuid',ids.conflict))[0].status).toBe('PendingReview');
 });
 it('serializes simultaneous confirmation and safely handles retries',async()=>{
  await approve();const v=await version();const cmd={bookingId:bid,version:v,action:'confirm'};
  const result=await Promise.all([execute(staff,cmd),execute(staff,cmd),execute(staff,cmd)]);
  expect(new Set(result.map((r:any)=>r.orderId)).size).toBe(1);
  expect((await rows(db,'SELECT * FROM catering_order')).length).toBe(1);
  expect((await rows(db,"SELECT * FROM status_event WHERE new_status='Confirmed'")).length).toBe(1);
  await expect(db.$executeRawUnsafe("INSERT INTO catering_order(id,booking_id,status) VALUES($1::uuid,$2::uuid,'Created')",randomUUID(),bid)).rejects.toThrow();
 });
 it('rolls back confirmation when required history persistence fails',async()=>{
  await approve();
  await db.$executeRawUnsafe("CREATE FUNCTION test_reject_confirm() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.new_status='Confirmed' THEN RAISE EXCEPTION 'injected history failure'; END IF; RETURN NEW; END $$");
  await db.$executeRawUnsafe('CREATE TRIGGER test_failure BEFORE INSERT ON status_event FOR EACH ROW EXECUTE FUNCTION test_reject_confirm()');
  try{
   await expect(action('confirm')).rejects.toThrow();
   expect((await rows(db,'SELECT * FROM catering_order')).length).toBe(0);
   expect((await rows(db,'SELECT status FROM booking WHERE id=$1::uuid',bid))[0].status).toBe('Approved');
  }finally{await db.$executeRawUnsafe('DROP TRIGGER test_failure ON status_event');await db.$executeRawUnsafe('DROP FUNCTION test_reject_confirm()');}
 });
 it('preserves immutable sources and requires a real event location',async()=>{
  const [b]=await rows(db,'SELECT * FROM booking WHERE id=$1::uuid',bid);
  await expect(db.$executeRawUnsafe("UPDATE inquiry SET original_text='AI replacement' WHERE id=$1::uuid",b.inquiry_id)).rejects.toThrow('immutable');
  await expect(db.$executeRawUnsafe("UPDATE quote_version SET total=0 WHERE id=$1::uuid",b.accepted_quote_version_id)).rejects.toThrow('immutable');
  await expect(db.$executeRawUnsafe("INSERT INTO inquiry(id,customer_id,original_text,event_date,event_type,event_location,guest_count,service_type,dietary_restrictions,special_requests) VALUES($1::uuid,$2::uuid,'Unknown location','2030-01-01','Lunch',' ',20,'Buffet','','')",randomUUID(),b.customer_id)).rejects.toThrow();
 });
 it('enforces source/acceptance relationship and disallows orders without confirmation',async()=>{
  const [other]=await rows(db,'SELECT * FROM booking WHERE id=$1::uuid',ids.conflict);
  await expect(db.$executeRawUnsafe('UPDATE booking SET acceptance_id=$1::uuid WHERE id=$2::uuid',other.acceptance_id,bid)).rejects.toThrow();
  await expect(db.$executeRawUnsafe("INSERT INTO catering_order(id,booking_id,status) VALUES($1::uuid,$2::uuid,'Created')",randomUUID(),bid)).rejects.toThrow('confirmed booking');
 });
 it('keeps AI review separate and supports manual completion during outage',async()=>{
  await action('ai');const [a]=await rows(db,'SELECT * FROM ai_analysis');
  await action('aiReview',{recordId:a.id,review:'Accepted',reason:'Suggestion reviewed; not booking authorization'});
  expect((await rows(db,'SELECT status FROM booking WHERE id=$1::uuid',bid))[0].status).toBe('PendingReview');
  await expect(action('ai',{simulateFailure:true})).rejects.toThrow('Manual review');
  const old=process.env.AI_MODE;process.env.AI_MODE='unavailable';
  try{await expect(action('ai')).rejects.toThrow('unavailable');await approve();await action('confirm');}finally{process.env.AI_MODE=old;}
 });
 it('tracks clarification evidence and requires renewed feasibility review',async()=>{
  await action('clarify',{reason:'Confirm service instructions'});const [c]=await rows(db,'SELECT * FROM clarification_request');
  await action('feasibility',{reason:'Reviewed'});
  await expect(action('decision',{outcome:'Approved',reason:'Reviewed'})).rejects.toThrow('clarification');
  await action('resolve',{recordId:c.id,reason:'Customer confirmed buffet; fictional email DEMO-REPLY-1'});
  await expect(action('decision',{outcome:'Approved',reason:'Reviewed'})).rejects.toThrow('feasibility');
  await approve();await action('confirm');
 });
 it('rechecks quote expiry at confirmation',async()=>{
  await approve();vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2030-06-02T00:00:00Z'));
  try{await expect(action('confirm')).rejects.toThrow('expired');expect((await rows(db,'SELECT * FROM catering_order')).length).toBe(0);}finally{vi.useRealTimers();}
 });
 it('does not expose review source, pricing or controls to kitchen',async()=>{
  await approve();await action('confirm');const d=await reviewData(ids.kitchen);
  expect(d.bookings).toEqual([]);expect(d.orders).toHaveLength(1);expect(d.orders[0].lines[0].unit_price).toBeUndefined();
 });
});
