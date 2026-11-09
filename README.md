# Let’s Cook — Build 1

Runnable fictional demonstration of Inquiry Review → Authorized Decision → separate Booking Confirmation → Operational Order → read-only Kitchen Handoff. No production GPT or live scheduling integration.

## Prerequisites and installation

Node.js 22.21+ (tested with 24.22.1), npm, Docker Engine with Docker Compose v2, and a local Git installation for version control. Ports 3000 and 5432 must be free. Run commands from this project directory.

```sh
npm ci
node scripts/init-env.mjs
npm run db:generate
docker compose up -d --wait
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. Read `DEMO_PASSWORD` from your local `.env` using your editor. All fictional staff share that locally generated password:

- `coordinator@demo.local`: review, decide, confirm.
- `manager@demo.local`: same authority plus return escalations to review with a documented resolution.
- `kitchen@demo.local`: confirmed handoff only.

`init-env.mjs` creates random database, session, and demonstration login secrets and refuses to overwrite existing `.env`. `.env.example` documents configuration without real secrets. Do not commit `.env`. Changing POSTGRES_PASSWORD after a volume has initialized does not change the database password: retain the existing credentials or intentionally recreate only your disposable demo volume.

`db:seed` **resets all application data** in databases named `lets_cook` or `lets_cook_test`. Use only disposable demonstration databases. It preserves Prisma migration metadata. Never point the seed command at operational data.

## Demonstrate the slice

1. Sign in as coordinator. Select Willow Arts Workshop: original text, accepted v2, v1 history and explicit email acceptance are visible.
2. Inspect the seeded calendar/roster evidence. Record a nonblank staff feasibility review note. This acknowledges demonstration evidence; it is not a live scheduling check.
3. Optionally generate a simulated advisory suggestion, review it, or simulate AI failure. No official booking field changes.
4. Record Approved with an evidence-based reason. Confirm Booking is a different button and is now available.
5. Confirm. One order with lines appears in the kitchen handoff. Decision and status history identify staff and server timestamps.
6. Sign out and sign in as kitchen. Only confirmed read-only handoffs are returned by the backend. Use Print handoff for one selected order.
7. Harbor Community Lunch has a scheduling conflict; Maple Studio Gathering has missing allergy details. Staff acknowledgement cannot bypass these blockers. Reject or escalate with a reason. These blocked fixtures cannot be made clear through this prototype.

Clarification requests and responses are recorded locally, not sent. Recording a clarification response requires response text and its evidence source in the same field. It invalidates the previous feasibility acknowledgement and requires renewed review. Unresolved clarifications block approval.

Set `AI_MODE=unavailable` in `.env` and restart to simulate a persistent AI outage. The separate Simulate AI failure button demonstrates a single failed call. Normal manual review remains available. Application/database outages return failure; there is no offline mutation queue.

## Automated tests

Create the disposable test database once:

```sh
docker compose exec -T db sh -c 'createdb -U "$POSTGRES_USER" lets_cook_test'
```

If it already exists, omit that command. Integration and browser runners derive `/lets_cook_test` from `DATABASE_URL`; they migrate/reset that test database, not the main demo database. Do not run the suites concurrently because they share the test database. Stop an existing application on port 3000 before browser tests.

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm start
```

If Chromium is already installed, omit its download and set its executable path, for example:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

`npm test` checks real PostgreSQL constraints/transactions. Browser tests launch the dev server against the isolated test database. For actual execution results and limitations see TEST-RESULTS.md. `npm start` requires a completed build; stop it before `npm run dev` or browser tests.

Stop PostgreSQL without deleting its data:

```sh
docker compose down
```

## Files and design

See FILES.md for the complete source inventory, DECISIONS.md for design refinements and implemented-versus-planned reconciliation, and TEST-RESULTS.md for executed validation. This is a local demonstration, not a production deployment configuration.

## GitHub and the exact baseline

Repository: `miasfer21-sys/lets-cook-catering-system`. The annotated tag
`build-1-baseline` resolves to commit `1627ccb8dd72b83489ce2d64fc7de989e3cb7784`.
Preserve this tag and commit. TD11 work is local on `td11-testing-refinement`,
created from that baseline; no push or merge is authorized.

See TD11-TESTING.md for fresh executed tests and evidence and TD11-REFINEMENTS.md
for investigated discrepancies, refinements, retests and outstanding policy questions.

To verify the baseline without changing it:

```sh
git rev-parse 'build-1-baseline^{commit}'
git status --short --branch
```

Review changes and exclude `.env`, dependencies, database storage and browser
session data before committing. Push or merge only after the repository owner's
approval. No production credentials or customer records are used in TD11.
