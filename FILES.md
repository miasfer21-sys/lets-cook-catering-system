# Source and evidence inventory

## Application

- `src/app/page.tsx`: staff login, booking/source/quote review, clarification
  response/source, staff assessment/disposition history, separate approval and
  confirmation, confirmed snapshot handoff and selected-order print.
- `src/app/api/workflow/route.ts`: session identity, same-origin checks and error
  responses; delegates authorization and workflow rules to application services.
- `src/lib/workflow.ts`: staff-role validation, current versions/booking locks,
  prerequisites, append-only disposition revisions, invalidation, atomic order
  and approved-instruction snapshot, read-minimized Kitchen projection, simulated
  advisory AI and manual fallback.
- `src/lib/auth.ts`, `password.ts`, `db.ts`: local fictional authentication,
  password hashing and parameterized SQL/Prisma access.
- `src/app/style.css`, `layout.tsx`, auth route: presentation, print and app shell.

## Persistence and setup

- `prisma/migrations/202611090001_build1/`: original domain schema and history guards.
- `prisma/migrations/202611090002_evidence_hardening/`: original AI/feasibility guards.
- `prisma/migrations/202611090003_clarification_disposition/`: final separate source,
  append-only disposition and immutable instruction-snapshot structures/guards.
- `prisma/schema.prisma`, migration lock: SQL-first Prisma configuration.
- `scripts/init-env.mjs`: create random local secrets without overwriting existing env.
- `scripts/seed.ts`: disposable fictional reset/fixtures, including new tables.
- `compose.yaml`, `.env.example`, `.gitignore`: local database, placeholder config,
  exclusion of credentials, generated files and scratch work.
- `package.json`, lockfile, Next/TypeScript configs: pinned installed dependency
  resolution and build/run commands. Final adds no dependencies.

## Verification

- `tests/workflow.test.ts`: original 13 PostgreSQL controls; clarification test
  adapted to separate source and explicit disposition.
- `tests/td11.test.ts`: eight TD11 scenarios; clarification input adapted to final
  contract, retaining stale-review assertion and exact accepted-version checks.
- `tests/final.test.ts`: final authorization, disposition, privacy, material blocking,
  invalidation, snapshots, rollback and concurrency scenarios.
- `tests/browser/workflow.spec.ts`: four existing browser/API/AI scenarios.
- `tests/browser/final.spec.ts`: final response/disposition, blocked approval,
  renewed review, Kitchen confidentiality, print and material escalation.
- `scripts/test-integration.ts`: derives disposable test DB; serial integration,
  browser or production-smoke runners.
- `scripts/test-final-migrations.ts`: create fresh/prior-schema disposable rehearsal
  DBs and verify upgrade preserves authoritative records.
- `scripts/smoke-production.ts`: start built app on localhost, authenticate staff,
  confirm/retry and verify restricted Kitchen instructions, then stop server.
- `vitest.config.ts`, `playwright.config.ts`: serial DB sharing and browser setup.

## Documentation/history

- `README.md`: current setup, upgrade, demonstration, verification and scope.
- `DECISIONS.md`: original reconciliation plus final approved refinement.
- `FINAL-VALIDATION.md`, `evidence/final/`: current executed results and evidence.
- `TEST-RESULTS.md`: historical Build 1 validation.
- `TD11-TESTING.md`, `TD11-REFINEMENTS.md`, `evidence/td11/`: preserved TD11 results,
  design quotations, before/after evidence and checksums.

Final-versus-Build-1 capability: explicit accountable clarification disposition
now supplies only approved noncommercial instructions to an immutable confirmed
handoff. Quote generation, feasibility resolution and general amendments remain
outside the implemented slice.
