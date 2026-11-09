import 'dotenv/config';
import {spawn} from 'node:child_process';
import {chromium,expect} from '@playwright/test';
if(new URL(process.env.DATABASE_URL!).pathname!=='/lets_cook_test')throw Error('Production smoke requires disposable test database');
async function main(){
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1'],{env:process.env,stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',b=>process.stdout.write(b));server.stderr.on('data',b=>process.stderr.write(b));
 let browser;
 try{
  let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Production server exited');try{if((await fetch('http://localhost:3000')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}if(!ready)throw Error('Production startup timeout');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});const page=await browser.newPage();await page.goto('http://localhost:3000');await page.getByLabel('Email',{exact:true}).fill('coordinator@demo.local');await page.getByLabel('Password',{exact:true}).fill(process.env.DEMO_PASSWORD!);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Original customer source'})).toBeVisible();
  const bid='20000000-0000-4000-8000-000000000001';
  async function action(action:string,extra:any={}){const data=await (await page.request.get('http://localhost:3000/api/workflow')).json();const b=data.bookings.find((x:any)=>x.id===bid);const r=await page.request.post('http://localhost:3000/api/workflow',{headers:{Origin:'http://localhost:3000'},data:{bookingId:bid,version:b.version,action,...extra}});if(!r.ok())throw Error('Smoke action '+action+' failed: '+await r.text());return r.json();}
  await action('clarify',{reason:'Production smoke arrival access'});let data=await (await page.request.get('http://localhost:3000/api/workflow')).json();const c=data.bookings.find((x:any)=>x.id===bid).clarifications[0];
  await action('resolve',{recordId:c.id,reason:'North entrance please',source:'PRIVATE-PRODUCTION-SMOKE'});await action('disposition',{recordId:c.id,disposition:'ApprovedInstruction',instruction:'Use the north entrance.',materialChange:false,reason:'Arrival routing only; accepted requirements unchanged'});await action('feasibility',{reason:'Inspected seeded evidence'});await action('decision',{outcome:'Approved',reason:'Source, disposition and accepted v2 checked'});const confirmed=await action('confirm');const repeated=await action('confirm');expect(repeated.orderId).toBe(confirmed.orderId);
  const kitchen=await browser.newContext();const kp=await kitchen.newPage();await kp.goto('http://localhost:3000');await kp.getByLabel('Email',{exact:true}).fill('kitchen@demo.local');await kp.getByLabel('Password',{exact:true}).fill(process.env.DEMO_PASSWORD!);await kp.getByRole('button',{name:'Sign in',exact:true}).click();await expect(kp.locator('.handoff')).toContainText('Use the north entrance.');const kd=await (await kp.request.get('http://localhost:3000/api/workflow')).json();expect(JSON.stringify(kd)).not.toContain('PRIVATE-');expect(kd.bookings).toEqual([]);console.log('FINAL-PRODUCTION '+JSON.stringify({result:'PASS',startup:'HTTP 200',staffLogin:true,confirmedOrder:confirmed.orderId,retrySameOrder:true,kitchenInstructions:kd.orders[0].instructions,confidentiality:true}));
 }finally{await browser?.close();server.kill('SIGTERM');await new Promise<void>(resolve=>{if(server.exitCode!==null)resolve();else server.once('exit',()=>resolve());});}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
