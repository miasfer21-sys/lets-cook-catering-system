import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const dbPassword=randomBytes(24).toString('hex');
writeFileSync('.env',`DATABASE_URL=postgresql://cook:${dbPassword}@localhost:5432/lets_cook\nPOSTGRES_USER=cook\nPOSTGRES_PASSWORD=${dbPassword}\nPOSTGRES_DB=lets_cook\nNEXTAUTH_URL=http://localhost:3000\nNEXTAUTH_SECRET=${randomBytes(32).toString('hex')}\nDEMO_PASSWORD=${randomBytes(18).toString('hex')}\nAI_MODE=available\n`,{flag:'wx',mode:0o600});
console.log('Created local .env with random secrets. Open it locally for DEMO_PASSWORD. Existing files are never overwritten.');
