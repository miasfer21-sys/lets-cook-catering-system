# Let’s Cook — Final educational prototype

Staff review of an accepted quote → clarification response and accountable staff
disposition → renewed feasibility review → authorized decision → separate booking
confirmation → read-only/printable Kitchen handoff. The final addition carries
approved noncommercial arrival instructions into an immutable confirmed-order
snapshot. It materially extends the Build 1/TD11 slice without adding quote
generation, scheduling resolution or a general amendment workflow.

This is a fictional local demonstration: seeded feasibility evidence, simulated
advisory AI, no live availability or allergy-safety certification.

## Setup

Node.js 22.21+ (validated with 24.22.1), npm, Docker Engine/Compose v2 and Git are
required. Ports 3000 and 5432 must be free. Clone the repository and select the
reviewed final-development branch when it is made available; this final change
has not been pushed. Run commands from the project root.

```sh
npm ci
node scripts/init-env.mjs
npm run db:generate
docker compose up -d --wait
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. Development and production commands bind to 127.0.0.1.
Use the locally generated `DEMO_PASSWORD` from `.env` with:

- `coordinator@demo.local`: review, disposition, decide and confirm.
- `manager@demo.local`: same authority; may return eligible escalations to review.
- `kitchen@demo.local`: confirmed handoffs only; no review/decision authority.

`init-env.mjs` creates random local secrets, refuses to overwrite `.env`, and
never prints the password. `.env.example` contains placeholders. Do not commit
`.env`, browser sessions, database volumes or exports. Changing a Compose password
does not change an initialized database's password; retain existing disposable
credentials. No production credential setup is required.

**Seeding resets all application records.** Use only the disposable demonstration
`lets_cook` or test `lets_cook_test` database. Never use operational data.

## Upgrade an existing disposable TD11 demonstration

Back up any fictional work you wish to retain using your local database tooling.
Stop the application, keep its existing local `.env` and database volume, install
the reviewed source/dependencies, then run:

```sh
npm ci
npm run db:generate
npm run db:migrate
npm run dev
```

Do **not** seed if you want to retain the prior demonstration records. Migration
003 adds disposition history and instruction snapshots; it preserves prior
Inquiry, QuoteVersion, QuoteAcceptance, decisions, status history, orders and lines.
Legacy combined response/source text stays verbatim. An unconfirmed legacy
response needs a separate source and a staff disposition before approval.
Previously confirmed orders are not retroactively given new instructions.

## Final demonstration

1. Sign in as Coordinator and select Willow Arts Workshop. Inspect the immutable
   request, explicit fictional acceptance of v2 ($750), v1 history and seeded
   calendar/roster evidence.
2. Record a clarification question such as “Which arrival entrance should staff
   use?” Record “Please use the north entrance” as the customer response and a
   separate fictional email/document reference as its evidence source. Recording
   a response does not authorize an instruction or booking.
3. Assess whether accepted requirements remain unchanged. Record a reasoned staff
   disposition: approved operational instruction, rejected/not applicable, or
   escalated/material change. Approved instructions are deliberately limited to
   north entrance, south entrance or calling the venue contact on arrival. Only
   the selected instruction can reach Kitchen; the response/source and internal
   review reason remain internal. History preserves actor, reason and server time.
4. Record renewed feasibility acknowledgement. Try approving before disposition
   or without renewed review to demonstrate the blockers. Seeded scheduling or
   allergy findings are not cleared by acknowledgement or disposition.
5. Record Approved with a reason. This creates no operational order. Separately
   Confirm Booking: one order, menu lines and the current approved instruction
   snapshot are saved atomically. Repeated confirmations retrieve the same order.
6. Sign in as Kitchen. Inspect and print the confirmed handoff. The instruction
   shown/printed comes from the stored snapshot, not live clarification text.
7. For a material change to date, guest count, menu, pricing, allergies or accepted
   requirements, select material/uncertain assessment and Escalated. Confirmation
   stays blocked; even Manager return cannot bypass this amendment requirement.
8. Optionally generate/review simulated AI, or simulate failure. Proposals are
   historical, dated and advisory. Manual review still requires all normal checks.

A new clarification or disposition after approval returns the booking to
PendingReview, preserves its old decision/status history, increments its version,
and requires renewed review and approval. Confirmed bookings cannot be amended
through these controls. Customer responses and evidence sources cannot be edited;
record another clarification for new information. Disposition corrections append
new revisions. A material escalation cannot be cleared in this prototype.

Staff must compare the customer response with accepted requirements. A
conservative deterministic keyword guard additionally blocks obvious material
content; it is not comprehensive language understanding. No AI interprets or
authorizes changes. Unclear cases must be escalated. The controlled instruction
list cannot change menu, date, guest count, prices or allergy requirements.

## Verification and production-mode demonstration

Create the disposable test DB once (omit if already created):

```sh
docker compose exec -T db sh -c 'createdb -U "$POSTGRES_USER" lets_cook_test'
```

Run these **sequentially**, with no app using port 3000. Browser tests and builds
share `.next`; integration/browser/production smoke also share the test database.

```sh
npm run test:migrations
npm test
npx playwright install chromium
npm run test:e2e
npm run typecheck
npm run build
npm run test:production
```

`test:migrations` requires a local disposable PostgreSQL account with CREATEDB.
It creates uniquely named `lets_cook_final_fresh_*` and `lets_cook_final_upgrade_*`
rehearsal databases, leaves them available for inspection, and never drops an
existing DB. It compares prior authoritative records before/after upgrade.

Integration/browser/production smoke runners derive `/lets_cook_test` from the
local DATABASE_URL and migrate/reset fictional test records only. For installed
Chromium, prefix browser/smoke commands with `CHROMIUM_PATH=/usr/bin/chromium`.
The production smoke requires the preceding completed build; it starts/stops its
own localhost production server and verifies sign-in, confirmation, retry and
Kitchen instruction confidentiality. To run the demo manually after the build:

```sh
npm start
```

For actual results, failures, fixes, evidence and exact verification scope see
FINAL-VALIDATION.md. TD11-TESTING.md, TD11-REFINEMENTS.md and TEST-RESULTS.md remain
historical reports for their original commits, not current acceptance results.
Stop PostgreSQL without removing its data with `docker compose down`.

## Design, scope and repository

Repository: `miasfer21-sys/lets-cook-catering-system`.
Baseline tag `build-1-baseline` resolves to
`1627ccb8dd72b83489ce2d64fc7de989e3cb7784`. TD11 is
`2ceb3553cef4141a972814ace8a351a852e0687c` on `td11-testing-refinement`, pushed
with the owner's separate approval. Final work starts there on `final-development`;
no final push, merge, tag move or deployment is authorized.

See DECISIONS.md for TD7b–TD10 reconciliation and FILES.md for the inventory.
Real quote creation/revision/renewal, material amendments, conflict resolution,
allergy clearance, live scheduling/capacity allocation, external messaging,
payments, fulfillment, cancellation/closure, production SSO/security/operations
remain deferred. Application/database failure does not enable offline mutation.
AI outage is simulated, not a tested external-provider failure. No production
readiness claim is made.
