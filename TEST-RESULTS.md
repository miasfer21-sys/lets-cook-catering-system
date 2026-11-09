# Actual validation record — November 9, 2026

Execution environment: Linux, Node 24.22.1, npm 11.9.0, PostgreSQL 16 (Docker postgres:16-alpine), Next.js 15.5.29, Prisma 6.19.0, Vitest 3.2.7, system Chromium via Playwright. Secrets were generated locally and are excluded from delivery.

| Executed command | Actual result |
|---|---|
| `npm install --cache /workspace/work/npm-cache` | Passed: 131 packages installed and lockfile created. Initial default-cache install failed because the home cache was unwritable; workspace cache resolved it. |
| `docker compose up -d --wait` | Passed: PostgreSQL container healthy. |
| `npm run db:generate` | Passed: Prisma Client generated. |
| `npm run db:migrate` | Passed: both migrations applied to demo database. |
| `npm run db:seed` | Passed: three fictional bookings, three staff, six quote versions and acceptance/feasibility/history records seeded. |
| `docker compose exec -T db sh -c 'createdb -U "$POSTGRES_USER" lets_cook_test'` | Passed: isolated test database created. |
| `npm test` | Passed: 13 real-PostgreSQL tests, 1 test file; final run 3.55 seconds. |
| `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` | Passed: 3 browser/API tests, final run 18.6 seconds; isolated test database reset by runner. |
| `npm run typecheck` | Passed. |
| `npm run build` (standalone final rerun) | Passed: optimized production build, all routes generated. |
| `npm start` | Passed: production server started and reported ready. |
| `curl` to production homepage / unauthenticated workflow API | HTTP 200 / HTTP 401 respectively. |

Database tests cover staff/role checks, missing reason/stale review, manual review, source traceability, separate decision/confirmation, blocking conflicts/missing information, rejection/escalation, manager return to review, concurrent confirmation/retries and database uniqueness, injected history-write failure rollback, immutable original text/quote versions, nonblank event location, acceptance relationship integrity, prevention of unconfirmed orders, AI review separation/outage, clarification evidence, expiry recheck, and kitchen data minimization.

Browser tests cover coordinator sign-in/manual completion with simulated AI failure, separate approval and confirmation buttons, read-only kitchen access and forged-action denial, unauthenticated access and cross-origin mutation denial. Chromium was actually launched. No browser download was needed in this environment.

One intermediate production build failed because a dev browser-test server and production build wrote `.next` concurrently. Subsequent production validation is recorded below. Do not run build/dev/browser tests concurrently in the same project directory.

Not executed: real production SSO/provider integration, real AI service tests, live schedule/capacity tests, full accessibility audit, load/penetration testing, GitHub push, backup/restore drill, or deployment to a hosting service. No such results are claimed. No Git commit was created by this delivery.
