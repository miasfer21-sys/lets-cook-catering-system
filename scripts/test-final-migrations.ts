import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import {spawnSync} from 'node:child_process';
import {mkdirSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
// Creates two new explicitly disposable databases; never drops or resets an existing DB.
const base=new URL(process.env.DATABASE_URL!);
if(!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Migration rehearsal requires local disposable PostgreSQL');
const admin=new PrismaClient();
const prior='work/final-prior-schema';mkdirSync(prior+'/migrations',{recursive:true});copyFileSync('prisma/schema.prisma',prior+'/schema.prisma');
for(const name of ['202611090001_build1','202611090002_evidence_hardening']){mkdirSync(`${prior}/migrations/${name}`,{recursive:true});copyFileSync(`prisma/migrations/${name}/migration.sql`,`${prior}/migrations/${name}/migration.sql`);}
copyFileSync('prisma/migrations/migration_lock.toml',prior+'/migrations/migration_lock.toml');
function migrate(url:string,schema:string){const r=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy','--schema',resolve(schema)],{env:{...process.env,DATABASE_URL:url},encoding:'utf8'});console.log(r.stdout);if(r.status!==0)throw Error(r.stderr);}
async function snapshot(db:PrismaClient){const result:any={};for(const t of ['inquiry','quote_version','quote_acceptance','booking','approval_decision','status_event','catering_order','order_line'])result[t]=await db.$queryRawUnsafe(`SELECT * FROM ${t} ORDER BY id`);return JSON.stringify(result);}
async function main(){try{
 for(const mode of ['fresh','upgrade']){
  const name=`lets_cook_final_${mode}_${Date.now()}`;await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);const u=new URL(base);u.pathname='/'+name;const db=new PrismaClient({datasourceUrl:u.toString()});
  try{
   let before='';let clarification='';
   if(mode==='upgrade'){
    migrate(u.toString(),prior+'/schema.prisma');
    const [staff,customer,inquiry,quote,v,acceptance,booking,decision,order,line,c]=Array.from({length:11},()=>randomUUID());clarification=c;
    await db.$transaction(async tx=>{
     await tx.$executeRawUnsafe("INSERT INTO staff_member(id,email,name,role,password_hash) VALUES($1::uuid,'fictional@demo.local','Migration fixture','Coordinator','NONLOGIN-FIXTURE')",staff);
     await tx.$executeRawUnsafe("INSERT INTO customer(id,name) VALUES($1::uuid,'Fictional migration fixture')",customer);
     await tx.$executeRawUnsafe("INSERT INTO inquiry(id,customer_id,original_text,event_date,event_type,event_location,guest_count,service_type,dietary_restrictions,special_requests) VALUES($1::uuid,$2::uuid,'Original migration evidence','2030-06-15','Lunch','Demo hall',30,'Buffet','Customer-provided only','Original instruction')",inquiry,customer);
     await tx.$executeRawUnsafe('INSERT INTO quote(id,inquiry_id) VALUES($1::uuid,$2::uuid)',quote,inquiry);
     await tx.$executeRawUnsafe(`INSERT INTO quote_version(id,quote_id,inquiry_id,version_number,pricing_details,terms,currency,subtotal,total,expires_at) VALUES($1::uuid,$2::uuid,$3::uuid,2,'[{"description":"Buffet","quantity":30,"unitPriceCents":2500}]','Original terms','USD',750,750,'2030-06-01')`,v,quote,inquiry);
     await tx.$executeRawUnsafe("INSERT INTO quote_acceptance(id,quote_version_id,inquiry_id,accepted_at,method,source) VALUES($1::uuid,$2::uuid,$3::uuid,now(),'Fictional email','MIGRATION-ACCEPT')",acceptance,v,inquiry);
     await tx.$executeRawUnsafe("INSERT INTO booking(id,customer_id,inquiry_id,accepted_quote_version_id,acceptance_id,status,version) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::uuid,'Confirmed',3)",booking,customer,inquiry,v,acceptance);
     await tx.$executeRawUnsafe("INSERT INTO approval_decision(id,booking_id,staff_id,outcome,reason,booking_version) VALUES($1::uuid,$2::uuid,$3::uuid,'Approved','Original decision',1)",decision,booking,staff);
     await tx.$executeRawUnsafe("INSERT INTO status_event(id,booking_id,previous_status,new_status,actor_id,reason,decision_id) VALUES($1::uuid,$2::uuid,'Approved','Confirmed',$3::uuid,'Original confirmation',$4::uuid)",randomUUID(),booking,staff,decision);
     await tx.$executeRawUnsafe("INSERT INTO catering_order(id,booking_id,status) VALUES($1::uuid,$2::uuid,'Created')",order,booking);
     await tx.$executeRawUnsafe("INSERT INTO order_line(id,order_id,description,quantity,unit_price,line_total) VALUES($1::uuid,$2::uuid,'Buffet',30,25,750)",line,order);
     await tx.$executeRawUnsafe("INSERT INTO clarification_request(id,booking_id,question,staff_id,response,resolved_by,resolved_at) VALUES($1::uuid,$2::uuid,'Legacy question',$3::uuid,'Legacy response and source combined',$3::uuid,now())",c,booking,staff);
    });before=await snapshot(db);
   }
   migrate(u.toString(),'prisma/schema.prisma');
   if(mode==='upgrade'){
    if(before!==await snapshot(db))throw Error('Upgrade altered existing authoritative records');
    const [c]:any=await db.$queryRawUnsafe('SELECT * FROM clarification_request WHERE id=$1::uuid',clarification);
    if(c.response!=='Legacy response and source combined'||c.response_source!==null)throw Error('Legacy evidence changed');
   }
   const migrations:any=await db.$queryRawUnsafe('SELECT migration_name FROM _prisma_migrations ORDER BY migration_name');
   console.log('FINAL-MIGRATION '+JSON.stringify({mode,database:name,result:'PASS',migrations,preserved:mode==='upgrade'?'exact inquiry/quote/acceptance/booking/decision/history/order/lines plus legacy clarification':'empty schema created',instructionRows:await db.$queryRawUnsafe('SELECT count(*)::int AS count FROM order_instruction')}));
  }finally{await db.$disconnect();}
 }
}finally{await admin.$disconnect();}

}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
