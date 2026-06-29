# UniBus System Truth Audit

**Date:** 2026-06-29

## Purpose
This document is a deep technical and business audit of the current UniBus codebase. It is intended to be the best practical handoff file for planning and development.

When documents conflict, this file prioritizes code, schema, tests, and actual runtime behavior over older narrative descriptions.

## Core product north star: student-benefit subsidy optimization
UniBus is not merely a bus-ticketing or fleet-operations system. Its core product idea is helping students travel to school by bus with the **best valid financial support available** from their university.

That means the system should revolve around these ideas:
- Students should receive the most beneficial valid support they are eligible for.
- Universities should be able to configure, track, and reconcile subsidy policies clearly.
- The platform must always distinguish:
  - original price,
  - subsidy granted,
  - final amount paid by the student.
- Route search, pass purchase, journey purchase, payments, QR validation, and reporting should all support this goal.

Subsidy is therefore not a side detail. It is one of the main reasons the system exists.

## Executive summary
UniBus is a **hybrid system**, not a single clean model.

It currently combines:
- a route registration + monthly pass model,
- a single-trip ticket model,
- a journey-order / multi-leg model,
- SePay and VNPay payment pathways,
- university subsidy and reconciliation logic,
- role-based operational UIs for student, driver, conductor, coordinator, admin, and university admin.

The codebase clearly shows that the system has **not fully migrated** into one order-only financial model. Instead, it is evolving from a pass-centric system into a broader order-capable platform.

At the same time, the project concept is valid and strong: UniBus is best understood as a **B2B2C student mobility and subsidy platform**, not as a simple bus ticket app.

## Product positioning: the correct interpretation
### Recommended product positioning
UniBus is a B2B2C student bus platform where:
- UniBus operates the bus service and ticketing system,
- universities define and fund subsidy support,
- students find routes and buy tickets with the most appropriate final price based on their support eligibility.

### Important scope clarification
In the current project scope:
- there is **no third-party transport operator model**,
- UniBus itself should be treated as the **default transport operator**,
- multi-operator support is a future expansion, not a current requirement.

So the correct B2B2C interpretation is:
- `B`: UniBus
- `B`: University
- `C`: Student

Not:
- UniBus + third-party operator + university + student

That broader operator ecosystem can be added later if desired, but it should not be assumed now.

## Source of truth hierarchy
When artifacts conflict, use this priority:
1. Backend schema migrations in `backend/src/main/resources/db/migration`
2. Backend controllers, services, and repositories in `backend/src/main/java`
3. Backend tests in `backend/src/test/java`
4. Frontend runtime screens and API DTOs
5. Narrative documentation in `README.md` and `docs/*`

## What is definitely true
### 1) Route registration is still a core domain
The student flow still explicitly separates route registration from ticket purchase.
- Verified in `backend/src/main/java/com/unibus/api/registration/RouteRegistrationService.java`
- Route registration remains route + default stop pair based.
- Active monthly passes lock route changes/cancellation.

### 2) Monthly pass purchase is still a core domain
- Verified in `backend/src/main/java/com/unibus/api/ticketing/TicketingService.java`
- Monthly pass issuance still creates or uses `monthly_passes`, `payments`, and `invoices`.
- Subsidy is computed and stored as original, subsidy, and final amounts.

### 3) Single-trip ticketing is active
- Verified in `backend/src/main/java/com/unibus/api/ticketing/TicketingController.java`
- `single_trip_tickets` is part of the real flow.

### 4) Journey-order flow is active
- Verified by `JourneyOrderView`, `JourneyOrderItemView`, `journey_orders`, and `journey_order_items`.
- Multi-leg student travel is a real supported concept.

### 5) SePay order flow is active and V16 is real
- `V12__sepay_integration.sql` created `tb_orders` and `tb_transactions`.
- `V16__sepay_journey_combo_orders.sql` added:
  - `order_mode`
  - `ticket_period`
  - `origin_label`
  - `destination_label`
  - `legs_json`
  - `original_amount`
  - `subsidy_amount`
  - `final_amount`

### 6) University subsidy and reconciliation is a real backend domain
- `PaymentTransactionView` and `ReconciliationView` exist.
- University stats, subsidy, roster, domains, route assignment, and notifications are all implemented.

### 7) Conductor scan is route-based, not stop-pair-based
Backend tests confirm monthly-pass scan validates by route, trip, date, status, and QR, not by a hard stop-pair lock.

## Hybrid model map
### Legacy-but-active model
- `route_registrations`
- `monthly_passes`
- `payments`
- `invoices`
- `single_trip_tickets`
- `travel_history`

### Newer order-centric model
- `tb_orders`
- `tb_transactions`
- `journey_orders`
- `journey_order_items`

### Practical conclusion
The system is **hybrid by reality**, not by mistake.
It is carrying both the old pass/payment model and the newer order/journey model in parallel.

This is acceptable, but it creates risk if reports, UI screens, and product language pretend there is only one model.

## Default transport operator assumption
The current codebase should be interpreted as having **one implicit operator**: UniBus itself.

That means:
- drivers belong to the default UniBus operation,
- conductors belong to the default UniBus operation,
- coordinator/dispatcher roles belong to the default UniBus operation,
- buses, trips, routes, schedules, and live fleet are managed under that default operating layer.

### What this means for scope
- Do **not** assume third-party transport operators exist in the current project scope.
- Do **not** redesign the database immediately for multi-operator support.
- If the product narrative mentions transport operations, it should describe UniBus as the operator by default.

### Future extension
If needed later, the system could grow into a true operator platform with entities like:
- `transport_operators`
- operator-owned buses
- operator-owned staff
- operator settlement
- operator dashboards

But this is explicitly **future scope**, not present scope.

## Role truth audit
### Student
Current student experience includes:
- verification,
- route registration,
- monthly pass purchase,
- single-trip tickets,
- journey search/planning,
- payments,
- travel history,
- notifications.

The student role is the primary beneficiary of subsidy logic.

### Conductor
Conductor is necessary and valid.
Responsibilities include:
- scanning QR tickets,
- validating monthly, journey-monthly, and single-trip tickets,
- incidents,
- lost items,
- operational contact.

### Driver
Driver is necessary and valid.
Responsibilities include:
- schedule,
- active trip,
- route view,
- history,
- dispatch contact.

### Coordinator
Coordinator is necessary and valid.
Responsibilities include:
- schedules,
- route operations,
- live fleet,
- assignment,
- stop management,
- notifications,
- feedback support.

### Admin
Admin is necessary and valid.
Responsibilities include:
- users,
- universities,
- verification,
- complaints,
- violations,
- audit,
- transactions,
- fare,
- system-wide visibility.

### University Admin
University admin is necessary and strategically important.
Responsibilities include:
- university profile,
- domains,
- roster import,
- subsidy policy,
- student-facing support logic,
- stats,
- reconciliation,
- transaction review.

## Product decision: full-price purchase outside university subsidy
This needs to be explicitly documented as a product rule.

### Recommended decision
Students **should be allowed** to buy some routes at full price even when no university subsidy applies, **as long as the route is public and sellable**.

That means the system should distinguish between:
- routes a student is allowed to see or buy,
- routes a student is eligible to receive subsidy on.

### Why this is the best product decision
If the system blocks every route outside the student's university support scope, UX becomes too rigid.
A student may still reasonably want to pay full price for a route that is not university-supported.

### What should still be blocked
Routes can still be blocked when they are:
- private,
- disabled,
- reserved for another context,
- not intended for student purchase.

## Route availability vs subsidy eligibility
This is one of the most important conceptual clarifications the system needs.

### Route availability
This answers:
> Can this student see or buy this route at all?

Recommended future states:
- `PUBLIC`
- `UNIVERSITY_LINKED`
- `PRIVATE_TO_UNIVERSITY`
- `DISABLED`

### Subsidy eligibility
This answers:
> If the student buys this route, do they get subsidy?

Recommended states:
- `APPLIED`
- `NO_ACTIVE_POLICY`
- `ROUTE_NOT_LINKED`
- `NOT_VERIFIED`
- `NO_UNIVERSITY`
- `LIMIT_REACHED`
- `NOT_CONFIGURED`

### Why this matters
Right now the backend strongly uses university-linked route checks, but the product should grow toward separating access from subsidy.
That gives much better UX and much clearer business rules.

## Best-benefit optimization: current vs target
### Current state
The current system does compute subsidy for valid routes and valid students.
It already supports:
- original amount,
- subsidy amount,
- final amount.

### What is not yet fully proven
The current codebase does **not yet prove** there is a full optimization engine that always selects the best possible valid option across:
- multiple routes,
- multiple policies,
- journey vs monthly choices,
- single vs combo economics.

### Recommended target
The long-term target should be:
- if multiple valid support paths exist, choose the most beneficial valid one,
- explain why a route is recommended,
- compare final cost, not just raw route geometry or time,
- support journey or combo recommendations when they improve student value.

This is a product enhancement within scope, not a rewrite.

## Student case matrix
This is the clearest way to explain current and recommended behavior.

| Student situation | Route view | Route purchase | Subsidy | Recommended outcome |
|---|---|---|---|---|
| Verified + university linked + route linked + active policy | Yes | Yes | Yes | Show final subsidized price |
| Verified + university linked + route linked + no active policy | Yes | Yes | No | Allow full-price purchase |
| Verified + university linked + route public but not linked | Prefer yes | Prefer yes | No | Allow full-price purchase with clear warning |
| Verified + route private to another scope | No | No | No | Hide or block |
| Not verified | Limited | No for subsidy flows | No | Prompt verification |
| No university linked | Limited or public-only | Public-only if allowed | No | Allow public full-price only if product enables it |

## Financial truth and terminology
The project must not mix these concepts carelessly:
- `original_amount`
- `subsidy_amount`
- `final_amount`
- `amount`
- `orderTotal`
- `fareAmount`

### Recommended meaning
- `original_amount`: fare before subsidy
- `subsidy_amount`: university support amount
- `final_amount`: amount student pays
- `amount`: actual payment record amount

If reporting mixes these values, university reconciliation becomes unreliable.

## Documentation audit
### Likely outdated or partially outdated
#### `README.md`
Still useful, but incomplete relative to the current backend.
Main issue:
- it still reads too monthly-pass-centric and too internal-confirmation-centric for the current system reality,
- it does not fully represent SePay orders, journey order, and V16 semantics.

#### `docs/TESTSPRITE_PRD.md`
Useful as testing or presentation material, but not an authoritative spec.
It simplifies some role and API realities.

#### `docs/specification/UNIVERSITY_LINKAGE_REQUIREMENTS.md`
Still useful conceptually for university linkage and subsidy intent, but not enough for the newer finance and order semantics.

#### `docs/ba-role-audit-v16.md`
Useful as a role/business report, but this system-truth file should be treated as the stronger architectural and behavioral truth source.

## Mismatch and risk areas
### 1) Transactions vs reconciliation are not the same
The system should not permanently blur these into one screen or one concept.

### 2) Journey vs monthly pass needs clearer UI semantics
A journey pass is not just “another monthly pass”.
It represents multi-leg travel intent and should be treated carefully in UX and reporting.

### 3) Hybrid model can confuse developers and AI helpers
Without a document like this one, it is easy to wrongly assume:
- the system is fully pass-centric,
- or fully order-centric,
- or already multi-operator.
None of those assumptions is fully true.

## What should not be done
- Do not attach every route to every university just to simplify demos.
- Do not treat `route_universities` as if it alone defines subsidy.
- Do not collapse transaction history and reconciliation into one permanent concept.
- Do not expose deep financial detail to driver or conductor roles unnecessarily.
- Do not introduce multi-operator schema now unless the scope is intentionally expanded.
- Do not claim “best support guaranteed” unless a real best-benefit engine exists.

## Best-way recommendations
### Short term
- Keep UniBus as the default operator.
- Keep the B2B2C model between UniBus, university, and student.
- Allow full-price purchase for eligible public routes outside university subsidy.
- Separate transaction history from reconciliation.
- Expose V16 order fields in DTOs and UI where relevant.
- Improve route labels and explanations in student-facing flows.

### Medium term
- Explicitly separate route availability from subsidy eligibility.
- Introduce student-facing route explanation labels such as:
  - university supported,
  - full-price only,
  - not available,
  - best value,
  - fastest,
  - fewest transfers.
- Add a benefit score or recommendation layer.
- Add subsidy impact dashboards for university admins.

### Long term
- Add multi-operator support only if the business model truly expands.
- Add operator settlement and operator-specific management if needed.
- Add policy simulation and budget forecasting tools.
- Add stronger anti-abuse subsidy controls.

## Decision log
### Product decisions already recommended
- UniBus should be positioned as B2B2C.
- UniBus should be treated as the default transport operator in the current scope.
- Subsidy is a core product capability, not a secondary accounting field.
- V16 is the best finance/order semantic direction for future reporting and UI cleanup.
- Students should be allowed to buy some routes at full price even when no subsidy applies, as long as the route is public and sellable.

### Product decisions still needing explicit team confirmation
- Which routes are considered public vs private in product terms?
- How many subsidized passes can one student hold in one month?
- Can one student hold multiple active monthly passes under any circumstance?
- How should journey order evolve relative to classic monthly pass?
- Is there a future need for operator-level settlement?

## Confidence levels
### High confidence
- The project concept is strong and viable.
- The current system is hybrid, not single-model.
- B2B2C is the correct strategic framing.
- UniBus as default operator is the correct current-scope interpretation.
- Subsidy is one of the main differentiators of the platform.

### Medium confidence
- Full-price outside-subsidy support is the best product direction, but still needs explicit team adoption.
- Best-benefit optimization is the right goal, but not fully implemented today.

### Low confidence
- Immediate multi-operator modeling in the current project would be worth the cost.
- Operator settlement should be built now.

## Final judgment
The project idea is sound, meaningful, and more sophisticated than a typical ticketing or CRUD transport project.

Its strongest identity is not “bus ticket app” and not “fleet dashboard”.
Its strongest identity is:
- helping students travel to school by bus,
- applying valid university support fairly,
- showing the real final price clearly,
- giving universities transparent oversight and reconciliation.

The safest and best path is not a giant rewrite.
The best path is:
- keep the current hybrid model stable,
- clarify truth and terminology,
- strengthen subsidy and financial semantics,
- improve role-specific UI behavior,
- and evolve toward a cleaner V16-aligned product model step by step.
