# TD11a — Build Testing & Refinement

Executed November 9, 2026. Repository: `miasfer21-sys/lets-cook-catering-system`.
Local branch: `td11-testing-refinement`, created from baseline commit
`1627ccb8dd72b83489ce2d64fc7de989e3cb7784`.
Annotated tag `build-1-baseline` remains `b405fa201b5f42749b9be05751eaff41a9b87475`,
resolving to that commit. No remote writes, push, merge or baseline changes.

## Authority, scope and execution

Authoritative design: user-supplied **Project Part 2.docx**, TD7b–TD10, plus the
baseline implementation and its explicit reconciliation in DECISIONS.md.
Exact design quotations and source hash are in [design-rules.md](evidence/td11/design-rules.md).
R1–R8 below identify those extracts. The document's construction directions were
read as historical design context; the user's TD11 request governs this work.
No Build 1 result has been substituted for a fresh execution.

A fresh local checkout, random local demonstration secrets, and new Docker Compose
project `td11`/volume `td11_cook_data` were used. The runners migrated and reset only
`lets_cook_test` at localhost:5432. All records are fictional seeded examples.
No production credentials, real customers, external AI or live scheduling service
were accessed. Node 24.22.1, PostgreSQL 16 container, Prisma 6.19.0, Vitest 3.2.7,
Next.js 15.5.29 and system Chromium were used with the unchanged dependency lock.

Each integration test resets fictional fixtures before executing real application
services and PostgreSQL transactions. Tests run serially across files. The new
`tests/td11.test.ts` emits `TD11-EVIDENCE` JSON records containing actual IDs,
versions, persisted decisions, orders and history. Locate the test ID in
[integration-first.txt](evidence/td11/integration-first.txt) or
[integration-retest.txt](evidence/td11/integration-retest.txt).
Rejected calls are verified by executed assertions; a missing expected rejection
fails the test. Browser tests exercise signed-in HTTP sessions and the rendered UI.

Common fixture: Willow Arts Workshop (`20000000-0000-4000-8000-000000000001`),
June 15, 2030, Willow Hall, 30 guests, vegetarian buffet. v1 is $810; explicitly
accepted v2 is 30 × $25 = $750, expiring June 1, 2030. Harbor uses ID ending `002`
and has a scheduling Conflict. Maple uses ID ending `003` and has outstanding
customer allergy details. Coordinator/Kitchen staff IDs end `001`/`003` under
`10000000-0000-4000-8000-…`. Generated relationship IDs are in the evidence.

## Consequential test records

### TD11-01 — Normal booking path

- **Exact rule:** TD7b §4.9 (R3): “Booking is Approved”; “Verify approval is recorded”; “Create or retrieve the associated operational Order.” TD10 §6 (R7): “Keep Record Decision separate from Confirm Booking.”
- **Setup/data:** Fresh Willow fixture, Coordinator, no decisions/orders; common data above.
- **Action:** Record feasibility note `TD11 inspected seeded calendar and roster`; record Approved with `TD11 checked source, acceptance and feasibility`; query persisted state; separately confirm; retrieve Kitchen handoff.
- **Expected:** Approval alone creates no order. Confirmation creates one order and history tied to staff decision; Kitchen receives confirmed quantities without commercial lines.
- **Observed:** Approved at version 2 with zero orders; Confirmed at version 3 with one order, one Confirmed transition and linked Approved decision; Kitchen lines were exactly `Vegetarian buffet`, quantity 30.
- **Result:** PASS first execution and retest.
- **Evidence:** `TD11-01` JSON in integration-first/retest; browser normal-path test in browser-first/retest; after screenshot also shows the separate history and handoff.

### TD11-02 — Unresolved scheduling conflict

- **Exact rule:** TD7b reviewFeasibility (R1): “Identify conflicts or missing information”; TD8 reconciliation (R4): “Escalation must be recorded rather than silently overridden.”
- **Setup/data:** Fresh Harbor fixture with scheduling `Conflict`, capacity `Clear`.
- **Action:** Acknowledge feasibility; attempt Approved with `Attempt bypass`; then record Escalated with `TD11 calendar conflict unresolved`; attempt confirmation.
- **Expected:** Acknowledgement does not clear conflict. Approval/confirmation blocked; escalation preserves actor and reason, no operational order.
- **Observed:** Approval rejected with feasibility error; escalation persisted; confirmation rejected with approved-decision error; zero orders, Escalated decision and transition retained.
- **Result:** PASS first execution and retest. Resolving the seeded conflict is intentionally unsupported, not a failed conflict-clearance test.
- **Evidence:** `TD11-02` JSON and assertions in integration-first/retest and tests/td11.test.ts.

### TD11-03 — Missing information and unresolved clarification

- **Exact rule:** TD9 §8 (R6): “Missing information or unresolved exception” → “Request clarification or escalate; do not imply unverified dietary safety or confirmed availability.” Baseline README: “Unresolved clarifications block approval.”
- **Setup/data:** Fresh Maple missing `Customer allergy details outstanding`; independent fresh Willow with otherwise clear evidence.
- **Action:** Acknowledge Maple evidence and attempt approval. On Willow record `TD11 confirm dietary instructions`, acknowledge feasibility, then attempt approval while response remains absent.
- **Expected:** Both attempts blocked, with no decision/order falsely implying clearance.
- **Observed:** Maple rejected with feasibility error; Willow rejected with clarification error even after current acknowledgement; both PendingReview with no decisions/orders. Open question persisted.
- **Result:** PASS first execution and retest. Does not establish severe-allergy safety policy or missing-location draft support.
- **Evidence:** `TD11-03` JSON, corresponding executed rejection assertions; existing immutable-source test also freshly exercised blank-location database rejection.

### TD11-04 — Unauthorized kitchen approval

- **Exact rule:** TD7b validateDecisionAuthority (R2): “Check the applicable authorization rules”; TD10 §6 (R7): “Recheck active authorization … on the server before saving.”
- **Setup/data:** Fresh Willow, active Kitchen user.
- **Action:** Call decision Approved with `Forged kitchen decision`, current version and Kitchen identity; compare complete booking/order/decision/history snapshots. Browser also posts a forged approval through Kitchen's signed-in session.
- **Expected:** 403; no mutation or decision history; no approval UI for Kitchen.
- **Observed:** Service returned 403 `Booking review authority required.` and identical snapshots. Browser received HTTP 403 and found no Record Decision button.
- **Result:** PASS first execution and retest.
- **Evidence:** `TD11-04` JSON; Kitchen browser case in browser-first/retest. Identity is not supplied by a typed browser staff ID.

### TD11-05 — Concurrent and repeated confirmation

- **Exact rule:** TD9 §5–7 (R5): “Open existing order rather than duplicate Create Order”; TD10 §6 (R7): “Enforce unique CateringOrder.booking_id and idempotent confirmation.”
- **Setup/data:** Fresh Willow approved through current review; capture its version 2.
- **Action:** Six simultaneous `execute` calls with identical confirmation commands, then one more retry with the same now-stale version.
- **Expected:** All successful requests identify the same order; exactly one order, one Confirmed transition, one booking version increment.
- **Observed:** Seven returned order IDs were identical; one order, one Confirmed event, booking version 3. Retry opened existing order despite old version.
- **Result:** PASS first execution and retest. This tests one booking, not allocation contention between distinct events.
- **Evidence:** Seven actual results and persisted snapshot under `TD11-05` in integration-first/retest. Existing three-request and duplicate-constraint tests also freshly passed.

### TD11-06 — AI outage/manual fallback

- **Exact rule:** TD9 §8 (R6): manual decision is allowed “if all independent business conditions pass”; “No confirmation action becomes easier simply because AI is not available.”
- **Setup/data:** Fresh Willow; save a simulated proposal, then temporarily set test-process AI_MODE to unavailable (restored in finally).
- **Action:** Attempt AI request; compare booking with pre-AI snapshot; attempt approval without review; then perform normal feasibility, approval and confirmation manually.
- **Expected:** AI unavailable; no invented replacement or booking mutation; prerequisites still enforced; manual completion possible.
- **Observed:** AI request rejected with manual-review message; booking unchanged; premature approval rejected for feasibility; manual path reached Confirmed with one order. Original persisted analysis remained available. Browser separately exercised single-call simulated failure.
- **Result:** PASS first execution and retest for service behavior. Historical-output presentation was separately investigated in TD11-09.
- **Evidence:** `TD11-06` JSON in integration-first/retest, existing outage test, normal-path browser case. This is failure injection into the implemented simulator, not a claim of testing an external AI provider outage.

### TD11-07 — Quote acceptance/version traceability

- **Exact rule:** TD8 reconciliation (R4): “Booking must identify the exact quote version accepted.” TD10 §6 (R7): “Preserve original customer inquiry text and the exact accepted QuoteVersion.”
- **Setup/data:** Fresh Willow accepted v2; insert unaccepted v3 for same quote/inquiry with 30 × $30 `Unaccepted menu`, $900.
- **Action:** Try switching booking's accepted version to v3 without matching acceptance; attempt acceptance-source overwrite; perform normal approval/confirmation; query version history and order lines.
- **Expected:** Mismatched acceptance rejected, historical evidence immutable; accepted v2 remains authoritative regardless of latest version.
- **Observed:** Composite FK rejected mismatch; immutable trigger rejected acceptance overwrite; history contained [1,2,3], selected version remained 2; handoff referenced v2; persisted line was Vegetarian buffet, quantity 30, total $750, not v3's $900.
- **Result:** PASS first execution and retest. Quote editing/customer acceptance capture UI is deferred; this exercises supported relationships and versioned data through disposable test inserts.
- **Evidence:** `TD11-07` JSON includes acceptance ID, accepted version ID, all history IDs and persisted lines; assertions executed against PostgreSQL.

### TD11-08 — Clarification change invalidates feasibility review

- **Exact rule:** Baseline README: “Recording a clarification response … invalidates the previous feasibility acknowledgement and requires renewed review.” DECISIONS.md §4: “Booking versions invalidate acknowledgements on clarification changes.” This is a baseline refinement of TD7b reviewFeasibility (R1), not an invented exact TD7b quotation.
- **Setup/data:** Fresh Willow; question `TD11 confirm service instructions`; acknowledge current evidence (booking version 2).
- **Action:** Record response `TD11 customer: use north entrance; fictional email TD11-REPLY-8`; attempt approval before renewed review; then renew review, approve and confirm.
- **Expected:** Response advances booking version, old acknowledgement remains historical and cannot authorize approval; renewed review enables eligible path.
- **Observed:** Response advanced version 2→3 while acknowledgement stayed at 2; approval rejected with feasibility error. New review at version 4 allowed approval and confirmation; response/source persisted.
- **Result:** PASS first execution and retest. This is a clarification-record change, not an implemented accepted-quote/event-requirement amendment workflow. Material changes to guest count/menu/date remain outside the slice.
- **Evidence:** `TD11-08` JSON includes prior review version, response and final persisted history; existing clarification test also freshly passed.

### TD11-09 — Historical AI proposal presentation during outage

- **Exact rule:** TD9 §8 (R6): “Do not invent or reuse an old AI answer as a current finding; display source inquiry and versioned quote, with manual review instructions.”
- **Setup/data:** Browser Coordinator session, Willow after normal confirmation; generate one saved advisory proposal, then simulate failure.
- **Action:** Inspect saved proposal after outage; assert historical label and machine-readable generation timestamp.
- **Expected:** Existing saved output remains identifiable as historical, with its generation time; clear outage/manual message remains visible.
- **Observed before refinement:** Outage/manual message displayed, but saved card showed only `Proposed · simulated-advisor-v1`, source reference and suggestion; no historical label or generation timestamp. Three other browser tests passed; this new assertion failed.
- **Classification:** Implementation defect in presentation/clarity, conservatively inferred from R6; no evidence of regenerated content or unauthorized mutation. The required exact label/time presentation is the TD11 refinement, not verbatim design wording.
- **Refinement/retest:** Add historical label, persisted created_at time and explanation that outage does not refresh saved proposals. Retest passed with all four browser cases; screenshot visually inspected.
- **Result:** FAIL before refinement → PASS after refinement.
- **Evidence:** browser-first.txt failure output; [before DOM](evidence/td11/ai-outage-before.md); browser-retest.txt; [after screenshot](evidence/td11/ai-outage-after.png); tests/browser/workflow.spec.ts.

## Fresh execution ledger

| Execution | Actual result | Evidence |
|---|---|---|
| Baseline `npm test`, before new tests/code | 13/13 passed | baseline-tests.txt |
| New TD11 cases plus existing `npm test` | 21/21 passed | integration-first.txt |
| Isolated browser first cycle, `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` | 3 passed, TD11-09 failed | browser-first.txt, ai-outage-before.md |
| Same browser command after refinement | 4/4 passed | browser-retest.txt, ai-outage-after.png |
| Final `npm test` | 21/21 passed | integration-retest.txt |
| Final `npm run typecheck` | Exit 0 | typecheck-retest.txt |
| Final `npm run build` | Exit 0 | build-retest.txt |

All ledger evidence lives in `evidence/td11/`; transcript line endings and trailing whitespace are normalized, without changing observed content. The final suite has 25 passing tests
across integration and browser runs; counts are not additive across repeated runs.
A preliminary browser run overlapped an operator-started Next build, causing a
shared `.next/routes-manifest.json` collision. Both were stopped, generated `.next`
removed, and browser testing restarted in isolation. That contaminated run is
retained as browser-discarded.txt and excluded from product findings/pass counts.
Final build ran after browser shutdown. Initial npm installation failed because
the default home cache was unwritable; retry using `work/npm-cache` succeeded with
no lockfile change. Neither setup issue is classified as an application defect.

## Practical limits

These results validate the implemented local demonstration, not production
readiness. Live scheduling/allocation, real AI/provider networking, pricing rules
beyond fixture snapshots, production SSO, load/security/accessibility certification,
real allergy clearance, payments and fulfillment were not tested. The existing
rollback/history-failure, quote-expiry, inactive-staff, stale-version, source
immutability and Kitchen data-minimization tests were freshly executed, not copied.
See TD11-REFINEMENTS.md for unresolved policy and intentionally deferred scope.
