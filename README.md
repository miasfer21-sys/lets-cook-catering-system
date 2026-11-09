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

No GitHub repository or commit is created by this delivery. After extracting the source archive into a new directory:

```sh
git init -b main
git status --short --untracked-files=all
git check-ignore .env node_modules .next
```

Review files before staging; exclude secrets, database dumps, customer data and local output. The supplied archive contains no `.env`, dependencies, database volume, or browser storage. `.env.example` contains placeholders only.

```sh
git add .
git diff --cached --name-only
git diff --cached
```

Inspect the staged diff for credentials. Then:

```sh
git commit -m "Build 1: authorized catering booking vertical slice"
git tag -a build-1-baseline -m "Reviewed Build 1 baseline"
git rev-parse HEAD
git rev-parse 'build-1-baseline^{commit}'
```

Record the full 40-character commit SHA emitted by both commands. That SHA identifies the exact baseline; the annotated tag is a readable label. Create an empty GitHub repository through GitHub, replace OWNER and REPOSITORY below, then push using your own configured Git credentials:

```sh
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
git push origin build-1-baseline
```

The immutable review link is `https://github.com/OWNER/REPOSITORY/tree/FULL_COMMIT_SHA`. Do not paste access tokens into commands or repository files. If a secret is ever committed, revoke it and remove it from history before sharing.
