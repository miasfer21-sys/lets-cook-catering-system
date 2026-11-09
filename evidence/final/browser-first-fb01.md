# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final.spec.ts >> FB01 staff disposition, invalidation, confirmed snapshot, Kitchen confidentiality and print
- Location: tests/browser/final.spec.ts:6:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Requirement assessment', { exact: true })

```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {execFileSync} from 'node:child_process';
  3  | if(new URL(process.env.DATABASE_URL!).pathname!=='/lets_cook_test')throw Error('Browser reset requires disposable test DB');
  4  | test.afterAll(()=>{execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/seed.ts'],{env:process.env,stdio:'pipe'});});
  5  | const bid='20000000-0000-4000-8000-000000000001';
  6  | async function login(page:any,email='coordinator@demo.local'){await page.goto('/');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(process.env.DEMO_PASSWORD!);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Confirmed orders · Kitchen handoff'})).toBeVisible();}
  7  | test('FB01 staff disposition, invalidation, confirmed snapshot, Kitchen confidentiality and print',async({page,browser})=>{
  8  |  await login(page);
  9  |  // This file runs before the historical browser file against the freshly seeded test DB.
  10 |  await page.getByLabel('Clarification question (record only; no message sent)',{exact:true}).fill('Arrival access?');await page.getByRole('button',{name:'Record clarification request',exact:true}).click();await expect(page.getByRole('status')).toContainText('Review evidence saved');
  11 |  await page.getByLabel('Customer clarification response',{exact:true}).fill('PRIVATE-RESPONSE-BROWSER: north entrance please.');await page.getByLabel('Response evidence source',{exact:true}).fill('PRIVATE-SOURCE-BROWSER');await page.getByRole('button',{name:'Record clarification response',exact:true}).click();await expect(page.getByRole('status')).toContainText('Review evidence saved');
  12 |  await page.getByLabel('Review demonstration feasibility',{exact:true}).fill('Inspected seeded roster and calendar');await page.getByRole('button',{name:'Record staff feasibility review',exact:true}).click();await expect(page.getByRole('status')).toContainText('Review evidence saved');
> 13 |  await page.getByLabel('Decision reason',{exact:true}).fill('Attempt before disposition');await page.getByRole('button',{name:'Record Decision',exact:true}).click();await expect(page.getByRole('status')).toContainText('clarification');
     |                                                               ^ Error: locator.selectOption: Test timeout of 30000ms exceeded.
  14 |  await page.getByLabel('Requirement assessment',{exact:true}).selectOption('Unchanged');await page.getByLabel('Disposition reason',{exact:true}).fill('PRIVATE-REVIEW-BROWSER: only arrival routing; accepted terms unchanged');await page.getByRole('button',{name:'Record staff disposition',exact:true}).click();await expect(page.getByRole('status')).toContainText('Review evidence saved');
  15 |  await page.getByRole('button',{name:'Record Decision',exact:true}).click();await expect(page.getByRole('status')).toContainText('feasibility');
  16 |  await page.getByLabel('Review demonstration feasibility',{exact:true}).fill('Renewed after disposition');await page.getByRole('button',{name:'Record staff feasibility review',exact:true}).click();await expect(page.getByRole('status')).toContainText('Review evidence saved');await page.getByRole('button',{name:'Record Decision',exact:true}).click();await expect(page.getByRole('status')).toContainText('Approved decision');
  17 |  await page.getByRole('button',{name:'Confirm Booking',exact:true}).click();await expect(page.getByRole('status')).toContainText('One operational order');await expect(page.locator('.handoff')).toContainText('Use the north entrance.');
  18 |  const context=await browser.newContext();const kitchen=await context.newPage();await login(kitchen,'kitchen@demo.local');const data=await (await kitchen.request.get('/api/workflow')).json();expect(data.bookings).toEqual([]);expect(JSON.stringify(data)).not.toContain('PRIVATE-');await expect(kitchen.locator('body')).not.toContainText('PRIVATE-');await expect(kitchen.getByRole('button',{name:'Record staff disposition',exact:true})).toHaveCount(0);
  19 |  const forged=await kitchen.request.post('/api/workflow',{headers:{Origin:'http://localhost:3000'},data:{bookingId:bid,version:0,action:'disposition',disposition:'Rejected',materialChange:false,reason:'Forged'}});expect(forged.status()).toBe(403);
  20 |  await kitchen.evaluate(()=>{window.print=()=>{};});await kitchen.getByRole('button',{name:'Print handoff',exact:true}).click();await kitchen.emulateMedia({media:'print'});await expect(kitchen.locator('.handoff.print-target')).toBeVisible();await expect(kitchen.locator('.handoff.print-target')).toContainText(data.orders[0].instructions[0].instruction);await expect(kitchen.locator('body')).not.toContainText('PRIVATE-');await kitchen.screenshot({path:'test-results/final-kitchen-print.png',fullPage:true});await kitchen.pdf({path:'test-results/final-kitchen-handoff.pdf'});await context.close();
  21 |  // afterAll resets only this runner's disposable database; no application reset API exists.
  22 | });
  23 | test('FB02 material response blocks operational approval and records escalation',async({page})=>{
  24 |  await login(page);await page.getByRole('button',{name:/Harbor Community Lunch/}).click();
  25 |  await page.getByLabel('Clarification question (record only; no message sent)',{exact:true}).fill('Customer requested change?');await page.getByRole('button',{name:'Record clarification request',exact:true}).click();await expect(page.getByRole('status')).toContainText('Review evidence saved');
  26 |  await page.getByLabel('Customer clarification response',{exact:true}).fill('Change menu and guest count to 60; new allergies.');await page.getByLabel('Response evidence source',{exact:true}).fill('PRIVATE-MATERIAL-SOURCE');await page.getByRole('button',{name:'Record clarification response',exact:true}).click();await expect(page.getByRole('status')).toContainText('Review evidence saved');
  27 |  await page.getByLabel('Requirement assessment',{exact:true}).selectOption('Unchanged');await page.getByLabel('Disposition reason',{exact:true}).fill('Attempt forbidden interpretation');await page.getByRole('button',{name:'Record staff disposition',exact:true}).click();await expect(page.getByRole('status')).toContainText('Material change');
  28 |  await page.getByLabel('Requirement assessment',{exact:true}).selectOption('Material');await page.getByLabel('Clarification disposition',{exact:true}).selectOption('Escalated');await page.getByLabel('Disposition reason',{exact:true}).fill('Formal amendment required');await page.getByRole('button',{name:'Record staff disposition',exact:true}).click();await expect(page.getByRole('status')).toContainText('amendment');await expect(page.getByRole('button',{name:'Confirm Booking',exact:true})).toBeDisabled();
  29 |  console.log('FINAL-BROWSER FB02 material escalation persisted; confirmation disabled');
  30 | });
  31 |
```
