# Design decisions and reconciliation

Source: uploaded Project Part 2.docx, TD7b–TD10, plus the user’s nine construction refinements. Document text is design evidence, not an instruction to perform unrelated actions.

## Implemented controls

- Customer → Inquiry → Quote → immutable QuoteVersion → explicit QuoteAcceptance → Booking → ApprovalDecision → CateringOrder/OrderLine is traceable. Composite foreign keys enforce customer/inquiry/acceptance/version consistency.
- Immutable original inquiry text is stored separately from AIAnalysis. Database triggers protect original inquiry, quote versions, acceptance, decisions, status history, feasibility acknowledgement history, and AI source/generated output.
- Staff-reviewed feasibility evidence is seeded and prominently labeled DEMONSTRATION. Scheduling/capacity/missing findings are not editable in the UI. Staff notes and acknowledgement history persist. Nothing contacts a real scheduling or workforce service.
- Required event location remains NOT NULL and nonblank. Missing-location intake is not supported; no placeholders are generated.
- Simulated advisory AI emits clarification suggestions and has explicit single-call/persistent outage modes. Accepted/Modified/Rejected analysis reviews never update Inquiry or Booking. No production model/API key exists.
- Record Decision and Confirm Booking are separate requests. The server reloads active staff authority and current state, checks concurrency versions, requires trimmed reasons, and saves decisions/history atomically.
- Confirmation locks the booking, rechecks evidence, quote expiry, approval and unresolved clarifications, then atomically creates lines/order, sets Confirmed, and records history. Unique CateringOrder.booking_id prevents duplicate orders. Deferred database triggers require a confirmed booking to have an order and lines, and disallow orders for unconfirmed bookings. Repeated confirmation returns the same existing order.
- Kitchen receives only confirmed orders, IDs, event fields, menu quantities, instructions and dietary cautions; no original narrative, AI, commercial pricing or approval controls.
- Manual review works during AI outage. Core failures return failure, never offline success.

## Explicit deviations/refinements from the plan

1. **Authentication:** Auth.js/NextAuth v4 Credentials with salted scrypt hashes and signed one-hour JWT sessions replaces the proposed OIDC provider for local runnable use. Identity is derived from the signed session; active role is rechecked from PostgreSQL on every read/mutation. Coordinator and Manager have explicit booking authority; Kitchen does not. No admin UI. Production SSO, MFA, login throttling, distributed abuse protection, session revocation and independent permission administration are deferred. Deactivating a staff record takes effect on the next API call.
2. **Prisma:** SQL-first versioned Prisma migrations and parameterized raw Prisma queries implement domain structures. Generated domain ORM models are not used; raw-query result typing is limited. This enables composite keys, immutable triggers and deferred integrity checks directly. No user value is concatenated into SQL.
3. **Pricing:** Build 1 validates USD integer-cent line snapshots, positive integer quantities and totals. Fixtures have no tax, discount, fees or deposits, so subtotal equals total. General quote calculation and TD8’s full tax/discount/charges columns are deferred rather than implied. Prior and accepted quote versions remain immutable. Invalid/inconsistent line snapshots block confirmation.
4. **Feasibility:** A booking has one seeded finding plus append-only staff acknowledgement history. Booking versions invalidate acknowledgements on clarification changes or escalation return. Approval increments the version once; confirmation requires evidence/approval for the immediately preceding version. There is no live capacity allocation, shared schedule reservation or conflict override. Booking locks prevent duplicate confirmation of that booking; they do not reserve capacity across different bookings. This prototype must not be used to promise real availability.
5. **Open policy choices:** Expired quotes block both approval and confirmation even if previously accepted. Past event dates and future-dated acceptance are blocked. Quote terms/expiry are explicit in fixtures (expiry June 1, 2030); refresh fixtures through reviewed migrations/seeding when needed. Fiscal/timezone policy is UTC for this demonstration; display uses browser locale. Production business timezone and expiry-after-acceptance policy require validation.
6. **Clarification:** Recorded question/response/source only; no outgoing customer communication. Original text stays immutable. This slice does not alter accepted event requirements or revise quotes; changed requirements require a future quote workflow. Seeded missing/conflict findings remain blockers even if a clarification is recorded. No automatic allergy-safety judgment.
7. **States:** Schema retains Proposed/PendingReview/Approved/Confirmed/Escalated/Rejected/Cancelled/Closed. UI implements decisions from PendingReview, confirmation from Approved, and Manager Escalated → PendingReview with reason and renewed review. Reconsideration, cancellation, closure, and Approved → renewed review are not exposed pending policy. An expired approved booking remains blocked; no recovery/requote UI yet.
8. **Audit:** Booking creation/submission, decisions, escalation return, and confirmation have StatusEvents. Decision and transition evidence are separate and linked. Feasibility acknowledgements and AI reviews have separate provenance. Administrator-level direct SQL is outside application guards; Docker’s local database owner credentials are for development. Production needs separately provisioned least-privilege migration/runtime accounts, backups/restore verification, TLS, monitoring and retention policy.
9. **Deployment:** One Next.js application and PostgreSQL. Development HTTP on localhost only; no hosted deployment, certificate configuration, or production resilience claim. No secrets are bundled in delivery.

## Implemented versus planned

| Area | Result |
|---|---|
| React/TypeScript/Next.js, PostgreSQL, Prisma, Zod | Implemented; Prisma uses SQL-first migrations |
| Auth.js / OIDC | Auth.js implemented; local credentials substituted; OIDC deferred |
| Staff review → decision → separate confirmation → order | Implemented |
| Source, acceptance, quote and decision traceability | Implemented with additional evidence tables |
| Feasibility | Staff-reviewed seeded demonstration, not live scheduling |
| Advisory AI and outage/manual path | Implemented simulation, no production GPT |
| Kitchen handoff | Implemented, read-only/printable |
| Clarification tracking | Local records implemented; messaging deferred |
| Real pricing, customer portal, kitchen scheduling, payments, fulfillment | Deferred |
| Production security/operations | Not complete; local demonstration only |

Additional schema scope: Inquiry and Quote lifecycle-status editing and unused broader-domain columns are omitted from this slice; Booking status is authoritative for the implemented workflow. Seeded inquiry event fields are immutable. Stable UUID relationships and core historical records are retained.

## Known limitations

No production authorization policy thresholds, automatic severe-allergy clearance, quote renewal, approved-booking recovery, cancellation, or operational closure. No live scheduling integration. Authentication has no rate limiter or SSO. There is no service-wide immutable audit sink or backup/restore exercise. The UI loads all demo bookings without pagination. Full screen-reader, print-printer, load, and penetration testing have not been performed. Browser tests cover selected roles and workflows, not exhaustive accessibility compliance. No claim of production readiness.
