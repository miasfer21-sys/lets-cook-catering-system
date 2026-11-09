# Source file inventory

- `.env.example`
- `.gitignore`
- `DECISIONS.md`
- `FILES.md`
- `README.md`
- `TEST-RESULTS.md`
- `compose.yaml`
- `next-env.d.ts`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `prisma/migrations/202611090001_build1/migration.sql`
- `prisma/migrations/202611090002_evidence_hardening/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `prisma/schema.prisma`
- `scripts/init-env.mjs`
- `scripts/seed.ts`
- `scripts/test-integration.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/workflow/route.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/style.css`
- `src/lib/auth.ts`
- `src/lib/db.ts`
- `src/lib/password.ts`
- `src/lib/workflow.ts`
- `tests/browser/workflow.spec.ts`
- `tests/workflow.test.ts`
- `tsconfig.json`
- `vitest.config.ts`

## Functionality map

- `prisma/`: SQL-first database schema, migrations and generated-client configuration.
- `src/lib/`: database access, authentication/password verification, transactional business services.
- `src/app/`: login/review/decision/confirmation/history/handoff screens, styling, authenticated API and same-origin mutation guard.
- `scripts/`: local secret configuration, fictional data reset/seed, isolated test runner.
- `tests/`: PostgreSQL integration tests and Chromium browser/API tests.
- Root configuration: dependencies/lockfile, TypeScript, Next.js, test runners, Docker Compose and ignored-secret configuration.
- `README.md`, `DECISIONS.md`, `TEST-RESULTS.md`: exact commands, baseline Git instructions, reconciliation, limitations and actual validation.
