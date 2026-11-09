# Final application validation

The application tests recorded below were executed November 9, 2026 on
`final-development`, created directly from verified TD11 commit
`2ceb3553cef4141a972814ace8a351a852e0687c`. The tested application was delivered
in commit `e6bb91ad453212df6a2650beb5c5058b84ec4d20`, subsequently pushed to
GitHub with owner approval and verified against the remote branch SHA.
The immutable Build 1 baseline remains
`1627ccb8dd72b83489ce2d64fc7de989e3cb7784`.

The owner accepted the application for this educational milestone, subject to
these documentation consistency corrections. This documentation-only revision
does not alter application code, tests, dependencies, migrations, data or the
historical evidence. **No application tests, build, migration rehearsal or
startup smoke test were rerun for this correction.** The execution dates,
outcomes and ledger below remain the original results.

The accepted application plus documentation corrections is identified by the new
annotated tag `final-project-baseline` on the resulting documentation commit.
Resolve its exact commit with `git rev-parse 'final-project-baseline^{commit}'`.
Publication verification consists of the documentation diff/clean-tree checks,
branch push, and comparison of the remote branch SHA and annotated tag's peeled
commit. It is separate from the historical application testing below. No merge,
deployment, movement/deletion of existing tags or history rewrite is authorized.

## Approved scope and material advancement

Only the owner's approved items 1–3 were implemented: clarification disposition
and confirmed instruction handoff, documentation reconciliation, and final
reproducibility/regression verification. Build 1/TD11 retained clarification text
internally; final adds distinct response/source evidence, explicit human
assessment/disposition with actor/reason/time, revision history, stale-review
invalidation and immutable confirmed-order instruction snapshots.

No quote-generation, feasibility-resolution, arbitrary requirement amendment,
new dependency, external AI integration or general redesign was added. The
original design authority is Project Part 2.docx, TD7b–TD10; exact source hash and
quotations remain preserved in evidence/td11/design-rules.md. DECISIONS.md records
which details are final implementation refinements rather than original wording.
TD11 historical documents and evidence were not rewritten.

## Execution environment and isolation

Node 24.22.1, Next.js 15.5.29, Prisma 6.19.0, Vitest 3.2.7, PostgreSQL 16 via the
existing local `td11` Compose project, and `/usr/bin/chromium`. All fixtures are
fictional. Local `.env` secrets were retained, not printed or committed. No
production credentials or real customer records were accessed or changed.

Integration/browser/production runners used `lets_cook_test` on localhost:5432.
A documented test-DB recreation was performed after tightening the uncommitted
migration's ApprovedInstruction nonnull check; no original demo data was reset.
Migration rehearsal created separate uniquely named disposable local databases.
No destructive seed was run against those rehearsal DBs or an operational DB.
Browser tasks finished before build/start tasks; no browser/build overlap occurred.

## Executed command ledger

| Command / run | Actual observed result | Evidence in `evidence/final/` |
|---|---|---|
| Initial `npm test` after new contract | 19 passed, 2 failed: older cases omitted separate response source | integration-first.txt |
| Retest with adapted inputs and nine new integration cases | 30/30 passed | integration-retest.txt |
| Full final integration suite after adding history-failure/race cases | **32/32 passed**: prior 21 plus 11 new | integration-final.txt |
| Initial migration rehearsal script | CJS transform rejected top-level await; no rehearsal DB actions executed | migrations-first.txt |
| `tsx scripts/test-final-migrations.ts` after async-main fix | **Fresh and prior-schema upgrade passed**, all three migrations installed | migrations-retest.txt |
| First browser run | Existing four passed; two new cases timed out locating dropdown labels | browser-first.txt, browser-first-fb01.md, browser-first-fb02.md |
| Diagnostic browser run | Backend writes succeeded; dropdown exact accessible-name lookup still failed | browser-diagnosis.txt, browser-label-failure.png |
| Browser retest after explicit dropdown accessible names | **6/6 passed**: prior four plus two new | browser-retest.txt |
| First final typecheck/build attempt | Failed on an untracked diagnostic scratch `.ts` file | typecheck-first.txt, build-first.txt |
| `npm ci --cache …/work/npm-cache` | Exit 0, 135 packages installed, unchanged lockfile | install.txt |
| `npm run db:generate` | Exit 0, Prisma client generated | generate.txt |
| `npm run typecheck` after scratch removed from compilation and clean install | **Exit 0** | typecheck-final.txt |
| `npm run build` after clean install | **Exit 0**, production bundle generated | build-final.txt |
| `CHROMIUM_PATH=/usr/bin/chromium npm run test:production` | **PASS**, HTTP 200 startup, Coordinator and Kitchen login, instruction confirmation, same-order retry, privacy | production-smoke.txt |
| Print PDF extraction/check and screenshot inspection | Approved north-entrance instruction present, internal markers/pricing absent, one selected handoff | kitchen-handoff.pdf, kitchen-print.png, print-text.txt, print-check.txt |

Commands are reproducible through README.md. The first npm install used an
explicit workspace cache because the environment's home cache is not writable;
this does not change dependency resolution. All evidence transcripts normalize
line endings/trailing whitespace without changing observed content. SHA256SUMS
covers the evidence files. Counts above are not added across repeated runs.

## Consequential final test records

Common setup: each integration case resets only the fictional test DB. Willow is
June 15, 2030, 30 guests, accepted v2 vegetarian buffet at $750; Harbor has a
scheduling Conflict and Maple has missing customer allergy details. Coordinator
is authorized; Kitchen is not. New integration code is tests/final.test.ts.
`FINAL-EVIDENCE` records actual persisted IDs, statuses and snapshots. Assertions
verify rejection paths; a missing rejection fails the test.

| ID / rule | Setup and action | Expected | Actual observed / result | Evidence |
|---|---|---|---|---|
| F01 — explicit disposition and authority; owner rules 2–3, TD10 signed identity | Record Willow response/source; acknowledge feasibility; attempt approval without disposition; forge Kitchen disposition; omit assessment; then Coordinator approves instruction | Unresolved disposition blocks; Kitchen denied; actor/time/reason recorded only on authorized disposition | Approval rejected for clarification; Kitchen authority rejection; missing assessment rejected; one Coordinator disposition revision persisted. **PASS** | integration-final.txt F01 |
| F02 — minimal immutable snapshot; rules 1,5,7 | Record private response/source; approve north then south revision; approve/confirm; query Kitchen; attempt post-confirmation and SQL history edits | Only latest approved south instruction reaches Kitchen; source/review/pricing withheld; original acceptance unchanged; no edits to history/snapshot | Kitchen instructions exactly south entrance; no PRIVATE markers, source fields, AI review or commercial pricing; acceptance/version IDs unchanged; edits rejected. **PASS** | F02 JSON |
| F03 — stale-review invalidation; rule 4 | Approve with instruction; change disposition; retry old confirmation and approve without renewed review; renew approval; add later question | Approved→PendingReview, old decisions retained; stale confirmation and stale feasibility blocked | Old confirm rejected for version; stale approval rejected for feasibility; two historical approvals and two returns to review persisted; no snapshot created. **PASS** | F03 JSON |
| F04 — material boundary; rule 6 | Separately test date, 60 guests, menu, $500 pricing, allergies and accepted-requirement changes; try approve/reject disposition; then escalate and attempt Manager resume/confirmation | Material content cannot become approved instruction or be dismissed; no source/quote rewriting; formal amendment blocker | Each approve/dismiss attempt rejected; all six Escalated; Manager return and confirmation denied; accepted version unchanged, no instructions/orders. **PASS** | Six F04 records and executed assertions |
| F05 — uncertainty/rejection; rules 3,6 | Declare vague response material/uncertain; attempt approval then escalate; separately reject a nonmaterial response and confirm | Human material declaration blocks without relying on keywords; rejected instruction omitted | Uncertainty blocked and escalated; rejected case confirmed with empty instruction snapshot. **PASS** | F05 and assertions |
| F06 — repeated/concurrent confirmation; rule 7 | Approve one instruction; six simultaneous confirmations plus stale-version retry | One order, instruction row and confirmation event; same order ID for every successful retry | Seven IDs identical; one order, one immutable instruction, one Confirmed event. **PASS** | F06 JSON |
| F07 — atomic snapshot insertion; rules 5,7 | Inject BEFORE INSERT instruction failure; confirm; inspect state, then remove injected trigger and retry | Entire order/lines/status/history rolled back; valid retry succeeds | Approved retained; no order/line/instruction/Confirmed event after failure; retry Confirmed with one instruction. **PASS** | F07 and assertions |
| F08 — unchanged conflict/allergy boundaries | Acknowledge Harbor and Maple then attempt approval | New instruction feature cannot clear existing blockers | Both approval attempts rejected for feasibility; no orders. **PASS** | F08 |
| F09 — source and controlled instruction integrity | Omit source, attempt arbitrary instruction changing menu/price, try direct response overwrite, then valid disposition | Source required; nonallowlisted instruction rejected; original response immutable | All invalid operations rejected; valid disposition recorded. **PASS** | F09 |
| F10 — rollback after snapshot insertion | Inject Confirmed-history persistence failure after instruction insertion; inspect then retry | Snapshot/order/status rollback together when later write fails | No snapshot/order remained; Approved retained; removing failure enabled one confirmed snapshot. **PASS** | F10 |
| F11 — disposition/confirmation race | Submit same-version later rejection and confirmation concurrently | Booking lock permits coherent confirmation or renewed review, never mixed snapshot | Observed confirmation won; disposition rejected; Confirmed with one prior approved instruction. Other order is explicitly covered by F03 sequential invalidation. **PASS** | F11 actual settled results |
| FB01 — real staff UI, privacy and print; TD9 output | Through browser, record response/source, attempt premature approval, disposition, attempt stale review, renew/approve/confirm; sign in separately as Kitchen and forge disposition; print selected handoff | Unresolved/stale actions blocked; only approved instruction reaches Kitchen/API/print; forged action 403 | Both approval blockers displayed; confirmed north instruction visible; Kitchen bookings empty and internal markers absent; forged disposition HTTP 403; snapshot text matched print DOM and generated PDF. **PASS** | browser-retest.txt, kitchen-print.png, kitchen-handoff.pdf |
| FB02 — material escalation through UI | Record menu/count/allergy change; try unchanged/approved disposition; then material/escalated disposition | Server blocks inappropriate approval, records escalation and disables confirmation | HTTP 409 Material change on first attempt; escalation saved with formal-amendment message; Confirm Booking disabled. **PASS** | browser-retest.txt HTTP results |

The previous 21 integration cases were rerun, including exact v2 acceptance with
unaccepted v3, immutable inquiry/quote/acceptance, stale updates, inactive staff,
blank reasons, Kitchen restrictions, conflict/allergy blockers, approval separate
from confirmation, rollback, concurrent/repeated confirmation, expiry, AI review
separation and persistent AI outage/manual completion. Two clarification cases
now supply separate response source and explicit disposition; their original
review-invalidation assertions remain. The historical TD11 result documents were
not edited. The prior four browser cases also all passed, including single-call
AI outage/manual confirmation, forged Kitchen approval, unauthenticated/cross-origin
denial and historical AI proposal timestamp/label.

## Migration evidence

The rehearsal script creates fresh unique DBs rather than repurposing existing
ones. In upgrade mode it first installs only migrations 001/002, inserts a
fictional confirmed booking with accepted quote/acceptance, approval/history,
order/line and legacy combined clarification evidence, then applies migration 003.
Exact before/after snapshots of Inquiry, QuoteVersion, QuoteAcceptance, Booking,
ApprovalDecision, StatusEvent, CateringOrder and OrderLine matched. Legacy
response text remained unchanged with separate source null; no instruction row
was invented for an already confirmed order. Fresh mode installed all three
migrations into an empty DB. Both PASS records include actual database names and
migration names in migrations-retest.txt. No old migration file was edited.

## Investigated failures, fixes and retests

1. **Contract change, not unexpected domain regression:** two old clarification
   tests omitted newly mandatory distinct source/disposition. Adapted inputs and
   retained assertions; full 32-case suite passed.
2. **UI accessible-name defect:** implicit wrapping labels included option text,
   so exact dropdown names were ambiguous. Diagnosis showed response HTTP 200 and
   persisted response/source, not lost data. Added explicit accessible names to
   the three new selects; six-case browser retest passed. First failures retained.
3. **Verification-script defect:** top-level await was unsupported by tsx's CJS
   transform. Wrapped rehearsal execution in async main; both migration paths
   executed and passed afterward.
4. **Scratch artifact contamination:** an untracked diagnostic TypeScript file
   was included by the project's broad TS glob. Removed its `.ts` extension from
   compilation; clean install/typecheck/build and production smoke passed. No
   application domain rule was relaxed to make these checks pass.
5. **Code-review hardening before final tests:** migration explicitly requires
   nonnull instruction for ApprovedInstruction, avoiding SQL CHECK's null
   semantics. Only the disposable test DB was recreated for the corrected new
   migration. Fresh/upgrade rehearsal and final integration tests used that
   corrected migration; neither original migration changed.

## Remaining limitations and policy questions

No unresolved failure remains in the executed final checks. This is still an
educational prototype, not a production catering commitment system.

- Human staff must assess arbitrary response meaning against accepted terms.
  The controlled instruction list prevents arbitrary official-field changes;
  conservative keyword blocking is supplemental and intentionally may overblock.
  It cannot comprehensively classify natural language. Uncertainty is escalated;
  AI never decides, authorizes or changes accepted records.
- Only three arrival/access instruction templates are supported. Additional
  noncommercial categories require reviewed design extension. Material escalation
  is intentionally irreversible through this slice; formal amendment/requote
  recovery is deferred. No post-confirmation editing is implemented.
- No live schedule allocation/clearance, allergy-safety certification, real AI
  provider outage, full quote calculation/renewal, payments or fulfillment was
  implemented/tested. Harbor/Maple fixtures remain blocked by design.
- Production approval thresholds, formal allergy policy, business timezone/expiry
  policy, incomplete-location intake and cancellation/closure remain unresolved.
  Local Coordinator/Manager authority is the documented demonstration policy.
- No production SSO/MFA, login throttling, least-privilege deployment provisioning,
  load/penetration certification, full accessibility audit or backup/restore
  exercise was performed. PDF/print rendering was tested; a physical printer was
  not used. No offline mutation or production readiness claim is made.

README.md, FILES.md and DECISIONS.md describe current final behavior. Historical
Build 1/TD11 scope statements remain identifiable as history and are superseded
only where explicitly reconciled. The reviewed application commit was pushed and
verified on `final-development`; the documentation-only correction and new
annotated `final-project-baseline` identify the accepted educational milestone.
Existing protected branches/tags and original histories remain preserved.
