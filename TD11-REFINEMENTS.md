# TD11a — Refinements and outstanding design questions

Work is local on `td11-testing-refinement`, based on commit
`1627ccb8dd72b83489ce2d64fc7de989e3cb7784`. Neither the baseline commit nor
`build-1-baseline` tag moved. No push, merge, deployment, production secret change
or real customer access occurred. See TD11-TESTING.md for setups, actions,
expected/observed results and evidence for each executed scenario.

## Investigated discrepancies and decisions

### D1 — Saved AI output is undated during an outage

**Classification: implementation defect (presentation/clarity); refined.**
TD9 §8 says not to reuse an old AI answer as a current finding (R6 in
`evidence/td11/design-rules.md`). The isolated TD11-09 browser test demonstrated
that the outage message appeared but an existing proposal card lacked any date
or historical label. Its failure output and before DOM were preserved before
changing application code. Inspection of `reviewData()` and `ai_analysis` showed
that persisted `created_at` was already returned; `page.tsx` simply did not render
it. No new AI answer was generated on failure, and service tests showed no
booking mutation. This limits the finding to ambiguity in the presentation;
it is not evidence of an authorization or data-integrity failure.

**Change:** `src/app/page.tsx` now identifies each saved card as “Historical
advisory proposal”, renders persisted generation time in a `<time dateTime>`
element, and explains that an outage does not refresh saved proposals. The
proposal's existing review state, source reference and generated output remain
visible. No schema or domain workflow change was needed. The exact label/time
choice is a justified TD11 implementation refinement, not a claim that TD9
specified that literal wording.

**Retest:** TD11-09 passed; all four browser cases passed. Screenshot
`evidence/td11/ai-outage-after.png` was opened and visually inspected. All 21
integration cases, typecheck and production build then passed.

### D2 — Repository setup instructions conflict with the existing repository

**Classification: artifact conflict; reconciled.**
The baseline README's “GitHub and the exact baseline” section described an
archive delivery with no GitHub repository and directed users to initialize Git,
create a baseline tag and push. Read-only GitHub ref inspection and the local
clone established that the repository and annotated baseline already existed;
the tag resolves to the current original Build 1 commit. These are historical
packaging instructions, not applicable TD11 actions. They were not executed.

**Change:** Replace that section with the actual repository/baseline identity,
read-only verification commands, TD11 report references, and the owner's
approval requirement for push/merge. This does not revise business policy or
rewrite original TD7b–TD10 design. Local `git rev-parse` verified the baseline
again after changes; `git diff --check` passed.

### D3 — Recording clarification is not a changed-requirements workflow

**Classification: incomplete design for material amendments; intentionally deferred.**
TD11-08 proves a new clarification response invalidates an old feasibility
acknowledgement. Inspection of `resolve`, immutable Inquiry, accepted QuoteVersion
and DECISIONS.md §6 confirms that recording free text does not amend authoritative
guest counts, date, menu, prices or accepted terms. The tested response was a
north-entrance instruction; it was retained as clarification evidence. The
handoff still derives event fields from Inquiry, not free-text clarification.
No claim is made that a changed service instruction automatically reaches the
Kitchen handoff. In this slice, staff must consult clarification evidence and
must not treat it as an updated operational instruction.

For a material customer change, a future design must specify amendment capture,
quote revision/reacceptance, approval invalidation and propagation to handoff.
Automatically interpreting free text to alter accepted terms would violate the
current authority boundary. Therefore no speculative code change was made.
The absence of this workflow was already explicitly deferred in baseline
DECISIONS.md; it is not a newly discovered failed implementation of an existing
amendment API. Renewed review alone must not be represented as support for such
amendments. **Open question:** what exact fields/changes require requoting and
which state transitions permit recovery from Approved/Confirmed?

### D4 — Blocked demonstration findings have no clearance workflow

**Classification: incomplete design outside the implemented slice; intentionally deferred.**
TD11-02/03 executed acknowledgements and attempted bypasses: conflict and missing
allergy details remained blockers, as the baseline promises. Source inspection
confirmed no UI action changes seeded findings. Returning an escalation to
PendingReview changes state and invalidates review; it does not clear a conflict.
This is an intentional demonstration limitation, not a failed scheduling API or
proof that a customer response resolves dietary risk. Future work needs
structured evidence updates, review authority and audit rules, plus actual
schedule/capacity allocation. No override was added to make these tests pass.

### D5 — Business policy remains provisional

**Classification: unresolved policy; no invented rules.**
The original design and baseline document these open questions:

| Policy question | Current observed/documented demonstration behavior | Required decision |
|---|---|---|
| Quote expiry after acceptance and timezone | Expiry blocks approval/confirmation; existing expiry test freshly passed. UTC demonstration checks, browser-local display. | Business timezone, validity window, acceptance-after-expiry and renewal rules. |
| Approval/escalation authority | Coordinator/Manager allowed; Kitchen denied; Manager-only escalation return tested by freshly rerun existing suite. | Confirm actual roles, thresholds and authority to resolve conflicts. |
| Missing required location | Database requires nonblank location; existing database test freshly passed. No incomplete-intake UI. | Draft inquiry state/schema versus reject incomplete authoritative submission. |
| Severe food-allergy requests | Seeded missing details block approval; no safety certification. | Formal escalation criteria, qualified reviewer and clearance evidence. |
| Reconsideration, cancellation, closure | Not exposed; no tests claim these operations work. | Permitted transitions, payment/fulfillment prerequisites and authorized roles. |

These are outstanding design questions, not passing production acceptance
criteria. The application must remain a fictional local demonstration until
these policies and the deferred architecture are resolved.

## Changed artifacts

| Artifact | Purpose |
|---|---|
| `src/app/page.tsx` | Historical AI label, generation timestamp, outage explanation (D1). |
| `tests/td11.test.ts` | Eight new executed consequential scenarios, real transaction assertions and per-ID observed evidence. |
| `tests/browser/workflow.spec.ts` | TD11-09 historical-proposal outage regression; existing three browser cases retained. |
| `README.md` | Replace stale archive/GitHub bootstrap instructions with actual baseline and TD11 review guidance (D2). |
| `.gitignore` | Exclude local `work/` scratch/cache; no secrets or dependency trees staged. |
| `TD11-TESTING.md`, `TD11-REFINEMENTS.md` | Fresh test ledger, discrepancy classification, implementation/design scope and open questions. |
| `evidence/td11/` | Design quotes/source hash, fresh first/retest logs, before DOM, after screenshot and checksums. |

No migration, credentials file, seeded business fixture, accepted quote, approval
rule, role grant or original design attachment was changed. `TEST-RESULTS.md`
remains the historical Build 1 report; TD11 results are separate.

## Retest and review outcome

Fresh baseline: 13/13 integration tests passed. With the new scenarios: 21/21
passed before and after refinement. Isolated browser first cycle: 3 passed,
TD11-09 failed; after D1: 4/4 passed. Final typecheck and Next production build
exited successfully. Evidence and commands are in TD11-TESTING.md. No remaining
failure was observed in executed tests.

An operator-started build overlapped the first browser attempt and collided with
Next's generated artifacts. That run was discarded and retained only as setup
evidence; it is neither a product defect nor a pass. All reported browser results
came from isolated runs. The final build was sequential after browser shutdown.

The final local change is reviewable without pushing. Live schedule integration,
provider AI resilience, general quote calculation/tax/deposits, customer messaging,
production SSO/security/operations, detailed kitchen scheduling, payments and
fulfillment remain deliberately deferred. No load, penetration, full accessibility,
backup/restore or real-provider outage test was performed. Local tests cannot
establish readiness for real bookings.
