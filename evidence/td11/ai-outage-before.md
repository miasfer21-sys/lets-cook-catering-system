# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow.spec.ts >> TD11-09 outage identifies saved AI proposals as historical evidence
- Location: tests/browser/workflow.spec.ts:26:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.proposal')
Expected substring: "Historical advisory proposal"
Received string:    "Proposed · simulated-advisor-v1Inquiry 8c33bfe5-cefd-43ce-9ff1-b3307240528d: immutable original_textConsider asking whether there are additional dietary or service instructions.Proposal reviewAcceptedModifiedRejectedReview explanation / modified interpretationSave advisory review"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('.proposal') with timeout 5000ms
  - waiting for locator('.proposal')
    14 × locator resolved to <div class="proposal">…</div>
       - unexpected value "Proposed · simulated-advisor-v1Inquiry 8c33bfe5-cefd-43ce-9ff1-b3307240528d: immutable original_textConsider asking whether there are additional dietary or service instructions.Proposal reviewAcceptedModifiedRejectedReview explanation / modified interpretationSave advisory review"

```

```yaml
- strong: Proposed · simulated-advisor-v1
- paragraph: "Inquiry 8c33bfe5-cefd-43ce-9ff1-b3307240528d: immutable original_text"
- list:
  - listitem: Consider asking whether there are additional dietary or service instructions.
- text: Proposal review
- combobox "Proposal review":
  - option "Accepted" [selected]
  - option "Modified"
  - option "Rejected"
- text: Review explanation / modified interpretation
- textbox "Review explanation / modified interpretation"
- button "Save advisory review"
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | async function login(page:any,email:string){await page.goto('/');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(process.env.DEMO_PASSWORD!);await page.getByRole('button',{name:'Sign in',exact:true}).click();}
  3  | test('coordinator manually reviews through separate confirmation despite simulated AI outage',async({page})=>{
  4  |  await login(page,'coordinator@demo.local');await expect(page.getByRole('heading',{name:'Original customer source'})).toBeVisible();
  5  |  await page.getByRole('button',{name:/Willow Arts Workshop/}).click();
  6  |  await expect(page.getByRole('button',{name:'Confirm Booking',exact:true})).toBeDisabled();
  7  |  await page.getByRole('button',{name:'Simulate AI failure'}).click();await expect(page.getByRole('status')).toContainText('Manual review');
  8  |  await page.getByLabel('Review demonstration feasibility',{exact:true}).fill('Inspected fictional calendar and roster; both clear.');
  9  |  await page.getByRole('button',{name:'Record staff feasibility review'}).click();await expect(page.getByRole('status')).toContainText('Review evidence saved');
  10 |  await page.getByLabel('Decision reason',{exact:true}).fill('Original source, accepted v2, acceptance and seeded evidence checked.');
  11 |  await page.getByRole('button',{name:'Record Decision',exact:true}).click();await expect(page.getByRole('status')).toContainText('Approved decision recorded');
  12 |  await expect(page.getByRole('button',{name:'Confirm Booking',exact:true})).toBeEnabled();
  13 |  await page.getByRole('button',{name:'Confirm Booking',exact:true}).click();await expect(page.getByRole('status')).toContainText('One operational order created');
  14 |  await expect(page.getByRole('heading',{name:'Kitchen handoff · Confirmed'})).toHaveCount(1);
  15 | });
  16 | test('kitchen receives read-only handoff and API rejects forged booking action',async({page})=>{
  17 |  await login(page,'kitchen@demo.local');await expect(page.getByRole('heading',{name:'Confirmed orders · Kitchen handoff'})).toBeVisible();
  18 |  await expect(page.getByRole('button',{name:'Record Decision',exact:true})).toHaveCount(0);
  19 |  const response=await page.request.post('/api/workflow',{headers:{Origin:'http://localhost:3000'},data:{bookingId:'20000000-0000-4000-8000-000000000002',version:0,action:'decision',outcome:'Approved',reason:'Forged action'}});expect(response.status()).toBe(403);
  20 | });
  21 | test('unauthenticated and cross-origin mutation denied',async({request})=>{
  22 |  const r=await request.get('/api/workflow');expect(r.status()).toBe(401);
  23 |  const p=await request.post('/api/workflow',{headers:{Origin:'https://untrusted.example'},data:{}});expect(p.status()).toBe(403);
  24 | });
  25 |
  26 | test('TD11-09 outage identifies saved AI proposals as historical evidence',async({page})=>{
  27 |  await login(page,'coordinator@demo.local');await page.getByRole('button',{name:/Willow Arts Workshop/}).click();
  28 |  await page.getByRole('button',{name:'Generate simulated suggestion',exact:true}).click();await expect(page.getByRole('status')).toContainText('proposal saved');
  29 |  await page.getByRole('button',{name:'Simulate AI failure',exact:true}).click();await expect(page.getByRole('status')).toContainText('Manual review');
  30 |  await expect(page.locator('.proposal')).toHaveCount(1);
> 31 |  await expect(page.locator('.proposal')).toContainText('Historical advisory proposal');
     |                                          ^ Error: expect(locator).toContainText(expected) failed
  32 |  await expect(page.locator('.proposal time')).toHaveAttribute('datetime',/.+/);
  33 |  await page.screenshot({path:'test-results/td11-ai-outage.png',fullPage:true});
  34 | });
  35 |
```
