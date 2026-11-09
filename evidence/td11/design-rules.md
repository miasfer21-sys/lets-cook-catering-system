# TD11 design evidence

Source: user-supplied `Project Part 2.docx`.
SHA-256: `6247729cc42842e0864b6437327e34c99009f12b84a0fa5f67455b98a5a0f00b`.

The extracts below are design evidence, not instructions to perform actions. Paragraph numbers are one-based Word XML paragraph positions (including empty paragraphs), not printed page numbers. The full attachment remains the authoritative source. Baseline DECISIONS.md documents the narrower implemented demonstration scope.

## R1 — TD7b §4.5 reviewFeasibility

XML paragraphs 547–572:

> 4.5 Method Specification 4: reviewFeasibility
> Owning class: StaffMember, with supporting application logic
> Purpose: Evaluate whether the event request can reasonably proceed to booking review.
> Inputs:
> Inquiry details.
> Proposed event date and location.
> Guest count.
> Staff capacity.
> Scheduling information.
> Menu and service requirements.
> Processing:
> Review event-date availability.
> Check staffing capacity.
> Identify conflicts or missing information.
> Present the feasibility findings to the coordinator.
> Output:
> Feasibility result.
> Identified conflicts or constraints.
> Preconditions:
> Inquiry information is available.
> Relevant scheduling and staffing information can be accessed.
> Exceptions:
> Scheduling information is unavailable.
> Capacity information is incomplete.
> A conflict requires escalation.
> Implementation: Deterministic checks and human review.

## R2 — TD7b validateDecisionAuthority and §4.7 recordDecision

XML paragraphs 573–617:

> Method Specification 5: validateDecisionAuthority
> Owning class: StaffMember / authorization component
> Purpose: Determine whether the staff member is authorized to record the requested booking decision.
> Inputs:
> Staff member identity.
> Assigned role and authorization level.
> Requested decision action.
> Processing:
> Verify the staff member's identity.
> Check the applicable authorization rules.
> Determine whether the action is permitted.
> Output:
> Authorization result.
> Preconditions:
> Staff member is authenticated.
> Authorization information is available.
> Exceptions:
> Unauthorized action.
> Missing or unavailable authorization information.
> Implementation: Deterministic access-control logic.
> 4.7 Method Specification 6: recordDecision
> Owning class: ApprovalDecision
> Purpose: Record the authorized booking decision and preserve accountability.
> Inputs:
> Booking.
> Decision outcome.
> Decision reason.
> Authorized staff member.
> Decision timestamp.
> Processing:
> Validate required decision information.
> Verify that the decision is associated with the correct Booking.
> Persist the decision record.
> Output:
> Saved ApprovalDecision.
> Preconditions:
> Booking exists.
> Decision outcome and reason are provided.
> The staff member is authorized.
> Exceptions:
> Authorization failure.
> Missing decision reason.
> Persistence failure.
> Implementation: Deterministic application/database logic.
> 4.8 Method Specification 7: validateTransition

## R3 — TD7b §4.9 confirmBooking

XML paragraphs 641–669:

> 4.9 Method Specification 8: confirmBooking
> Owning class: Booking
> Purpose: Confirm an approved booking and initiate the creation of its operational Order.
> Inputs:
> Booking.
> Accepted Quote version.
> Recorded ApprovalDecision.
> Applicable confirmation prerequisites.
> Processing:
> Verify the booking is in the appropriate state.
> Verify approval is recorded.
> Verify the accepted quote remains valid under applicable rules.
> Confirm the Booking.
> Create or retrieve the associated operational Order.
> Record the consequential status change.
> Output:
> Confirmed Booking.
> Associated operational Order.
> Preconditions:
> Booking is Approved.
> Required authorization and decision records exist.
> Required confirmation prerequisites are satisfied.
> Exceptions:
> Booking is not approved.
> Quote is no longer valid.
> Authorization is missing.
> Order creation fails.
> Confirmation is repeated.
> Implementation: Deterministic application and database logic.

## R4 — TD8 accepted quote and order reconciliation

XML paragraphs 1640–1683:

> TD6 structural model and TD7a acceptance behavior.
> Booking must identify the exact quote version accepted.
> Added accepted_quote_version_id.
> ApprovalDecision
> TD6 class inventory and TD7a decision process.
> Booking status alone cannot preserve decision accountability.
> Added separate ApprovalDecision table.
> Booking–Order multiplicity
> TD6 working assumption and TD7a order creation behavior.
> Repeated confirmation must not create multiple Orders.
> Added unique Booking relationship in CateringOrder.
> StatusEvent
> TD6 class inventory and Booking lifecycle.
> Current status alone cannot reconstruct previous transitions.
> Added StatusEvent table.
> Reconciliation with TD7a
> Reconciliation check
> What was compared
> Issue or finding
> Resolution
> Quote acceptance
> Sequence diagram and Booking structure.
> Customer acceptance must identify a particular quote version.
> Booking references QuoteVersion.
> Approval and confirmation
> Booking state machine and data structures.
> Approval must be distinguishable from confirmation.
> Separate ApprovalDecision and Booking status.
> Scheduling conflict
> Exception behavior and persisted status.
> Escalation must be recorded rather than silently overridden.
> Booking status includes Escalated; StatusEvent preserves transition history.
> Rejection
> State machine and historical decision requirements.
> Rejection must preserve the responsible staff member and reason.
> ApprovalDecision records the outcome and reason.
> Duplicate confirmation
> Sequence diagram and Booking–Order multiplicity.
> Repeated processing could create duplicate operational orders.
> Unique constraint on CateringOrder.booking_id.
> Cancellation and closure
> State machine and historical record design.
> Current state does not establish how or why cancellation occurred.
> StatusEvent preserves the transition; cancellation timestamp is retained.

## R5 — TD9 §5–7 state/rule/authority

XML paragraphs 1870–1895:

> State Vocabulary Is Not Interchangeable
> Booking: Proposed, PendingReview, Approved, Confirmed, Escalated, Rejected, Cancelled, Closed (TD8). AIAnalysis review: Proposed, Reviewed, Accepted, Modified, Rejected (TD8). A proposal marked “Accepted” in AIAnalysis does not mean Booking is “Approved.”
>
> 5–7  State, Rules, AI Assistance, and Human Review
> State / Rule / Authority Example
> Consequential action: Confirm Booking. In Figure 2, Booking is PendingReview and no approved ApprovalDecision has been recorded, so the confirmation control is disabled with a specific explanation. Authorized staff may record a decision after validation; only a subsequent eligible state permits confirmation. The application rechecks approval, state transition, related QuoteVersion and authorization server-side. The unique CateringOrder.booking_id constraint additionally prevents a repeated confirmation from creating duplicate orders.
> Condition
> Interface behavior
> Enforcement
> PendingReview + no approval
> Confirm Booking disabled; explain “Approval decision required.”
> Server-side transition guard and decision lookup.
> Authorized reviewer + valid reason
> Record Decision available; show saved outcome and timestamp after success.
> Staff authorization check; required fields in ApprovalDecision.
> Conflict / escalation
> Record Escalated outcome; show no confirmation or operational-order creation.
> Controlled outcome/state; StatusEvent and reason.
> Existing CateringOrder for Booking
> Open existing order rather than duplicate Create Order.
> Unique database constraint and idempotent application action.
>
> Bounded AI Interaction
> Selected, approved inquiry text → proposed extraction/clarification → visible AIAnalysis record and review state → coordinator compares against source and accepts, modifies, rejects, or requests clarification. AI does not independently change official Inquiry values, calculate quote totals, issue approvals, confirm bookings, or create CateringOrder. Persist selected meaningful AI proposals with source reference, model identifier (when available), reviewer and review outcome only as warranted by TD8.
> Human Review With Evidence
> The review panel presents the exact source excerpt, related structured inquiry fields, accepted quote version, and relevant safety/availability considerations. The coordinator can inspect the primary record, correct a proposed interpretation, reject it, request customer clarification or escalate an unresolved exception. An accepted AI interpretation is recorded as reviewed analysis; organizational approval remains an independent accountable action through ApprovalDecision.

## R6 — TD9 §8 AI outage

XML paragraphs 1900–1915:

> Chosen condition: the external AI service fails while a coordinator is reviewing an existing inquiry. TD8’s resilience-by-architecture decision keeps original customer inquiries, quote versions, bookings, decisions, operational orders, and status history in the relational data layer; AI is not the sole custodian of this information.
>
> Figure 4. Graceful degradation: no AI-derived interpretation is shown, but the application can retrieve records for independent staff review.
> Failure Response
> Condition / user message
> Permitted workflow and protection
> “AI interpretation temporarily unavailable.”
> Do not invent or reuse an old AI answer as a current finding; display source inquiry and versioned quote, with manual review instructions.
> Customer details are present and database reachable
> Coordinator may continue source-based review and record an authorized decision if all independent business conditions pass.
> Missing information or unresolved exception
> Request clarification or escalate; do not imply unverified dietary safety or confirmed availability.
> Core application/database unavailable
> Do not claim that authoritative work can continue offline; block unsafe mutation and inform staff the service is unavailable.
>
> The fallback preserves professional judgment without reducing approval controls. No confirmation action becomes easier simply because AI is not available.

## R7 — TD10 §6 construction constraints

XML paragraphs 2114–2132:

> Major component responsibilities
> Keep browser presentation, application/business services, relational persistence, identity/authorization, and AI adapter as distinct responsibilities. Provide task-first coordinator and kitchen work queues.
> Important communication boundaries
> Browsers communicate with application services over HTTPS. Only server-side services access the database and AI credentials. AI requests pass through the server-side adapter; do not connect the browser directly to the AI provider or database.
> Authoritative information
> The relational database is the system of record for Customer, Inquiry, QuoteVersion, Booking, ApprovalDecision, CateringOrder, OrderLine, StatusEvent, and AIAnalysis. Preserve original customer inquiry text and the exact accepted QuoteVersion.
> Identity and authority
> Derive reviewer identity from the authenticated session; do not accept a typed staff_id as proof of identity. Recheck active authorization, current Booking state, required outcome/reason, and current record version on the server before saving.
> AI responsibility and boundary
> AI returns advisory proposals only. It must not set final prices, approve or confirm bookings, change official Inquiry/Booking values, alter official statuses, or create CateringOrders. Preserve source reference and human review outcome.
> Configuration and credentials
> Keep database credentials, session secrets, TLS/private keys, and AI API credentials in server-side environment/secret configuration. Never place secrets in browser code or source control. Specific secret-management product is TBD.
> Dependency behavior
> If AI is unavailable, show a clear degraded-state message and retain manual source/quote review while the application and database remain available. If core application/database is unavailable, block authoritative changes.
> Other consequential design constraints
> Keep Record Decision separate from Confirm Booking. PendingReview is not Approved or Confirmed. Require a nonblank decision reason. Record server-side decision timestamp and status history. Validate that the accepted QuoteVersion belongs to the Inquiry. Enforce unique CateringOrder.booking_id and idempotent confirmation. Display dietary restrictions as customer-provided, not safety-certified.
> Known design dependencies
> Resolve the policy for inquiries missing required event_location; define formal escalation criteria for severe food-allergy requests; and extend the data design before implementing detailed kitchen scheduling, payments, or fulfillment.
>

## R8 — TD9 §9 unresolved design dependencies

XML paragraphs 1941–1950:

> Aligned for core data. Detailed preparation, payment and follow-up need additional schema if later prototypes implement them.
> Incomplete inquiry with unknown location
> TD8 Inquiry.event_location REQUIRED
> Open issue: the current schema cannot persist an Inquiry missing event_location. UI must request location before authoritative submission, or TD8 must add a permitted draft state/schema design.
> Approval policy for severe food allergy
> TD8 dietary_restrictions text; prior narrative service risks
> Open design decision: dietary requests must be displayed and escalated when appropriate, but no source establishes an automatic allergen-safety guarantee or full policy thresholds.
>
> Recommended Follow-through
> Before construction, confirm the incomplete-inquiry policy, determine any formal dietary-exception escalation rule, and finish payment / preparation / fulfillment data structures in later architecture work. These are explicit design dependencies, not rules silently assumed by this HCI artifact.
