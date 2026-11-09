import {test,expect} from '@playwright/test';
async function login(page:any,email:string){await page.goto('/');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(process.env.DEMO_PASSWORD!);await page.getByRole('button',{name:'Sign in',exact:true}).click();}
test('coordinator manually reviews through separate confirmation despite simulated AI outage',async({page})=>{
 await login(page,'coordinator@demo.local');await expect(page.getByRole('heading',{name:'Original customer source'})).toBeVisible();
 await page.getByRole('button',{name:/Willow Arts Workshop/}).click();
 await expect(page.getByRole('button',{name:'Confirm Booking',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Simulate AI failure'}).click();await expect(page.getByRole('status')).toContainText('Manual review');
 await page.getByLabel('Review demonstration feasibility',{exact:true}).fill('Inspected fictional calendar and roster; both clear.');
 await page.getByRole('button',{name:'Record staff feasibility review'}).click();await expect(page.getByRole('status')).toContainText('Review evidence saved');
 await page.getByLabel('Decision reason',{exact:true}).fill('Original source, accepted v2, acceptance and seeded evidence checked.');
 await page.getByRole('button',{name:'Record Decision',exact:true}).click();await expect(page.getByRole('status')).toContainText('Approved decision recorded');
 await expect(page.getByRole('button',{name:'Confirm Booking',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Confirm Booking',exact:true}).click();await expect(page.getByRole('status')).toContainText('One operational order created');
 await expect(page.getByRole('heading',{name:'Kitchen handoff · Confirmed'})).toHaveCount(1);
});
test('kitchen receives read-only handoff and API rejects forged booking action',async({page})=>{
 await login(page,'kitchen@demo.local');await expect(page.getByRole('heading',{name:'Confirmed orders · Kitchen handoff'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Record Decision',exact:true})).toHaveCount(0);
 const response=await page.request.post('/api/workflow',{headers:{Origin:'http://localhost:3000'},data:{bookingId:'20000000-0000-4000-8000-000000000002',version:0,action:'decision',outcome:'Approved',reason:'Forged action'}});expect(response.status()).toBe(403);
});
test('unauthenticated and cross-origin mutation denied',async({request})=>{
 const r=await request.get('/api/workflow');expect(r.status()).toBe(401);
 const p=await request.post('/api/workflow',{headers:{Origin:'https://untrusted.example'},data:{}});expect(p.status()).toBe(403);
});

test('TD11-09 outage identifies saved AI proposals as historical evidence',async({page})=>{
 await login(page,'coordinator@demo.local');await page.getByRole('button',{name:/Willow Arts Workshop/}).click();
 await page.getByRole('button',{name:'Generate simulated suggestion',exact:true}).click();await expect(page.getByRole('status')).toContainText('proposal saved');
 await page.getByRole('button',{name:'Simulate AI failure',exact:true}).click();await expect(page.getByRole('status')).toContainText('Manual review');
 await expect(page.locator('.proposal')).toHaveCount(1);
 await expect(page.locator('.proposal')).toContainText('Historical advisory proposal');
 await expect(page.locator('.proposal time')).toHaveAttribute('datetime',/.+/);
 await page.screenshot({path:'test-results/td11-ai-outage.png',fullPage:true});
});
