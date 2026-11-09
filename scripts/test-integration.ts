import 'dotenv/config';
import {spawnSync} from 'node:child_process';
const url=new URL(process.env.DATABASE_URL!);
url.pathname='/lets_cook_test';
const env={...process.env,DATABASE_URL:url.toString()};
const commands=process.argv.includes('--browser') ? [['prisma','migrate','deploy'],['tsx','scripts/seed.ts'],['playwright','test']] : [['prisma','migrate','deploy'],['vitest','run']];
for(const args of commands){
 const result=spawnSync(process.platform==='win32'?'npx.cmd':'npx',args,{env,stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
