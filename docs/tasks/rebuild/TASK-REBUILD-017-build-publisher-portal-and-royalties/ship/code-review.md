# Code review

Reviewed against TASK-REBUILD-017 acceptance criteria.

- Publishing requests and publisher MARC are non-financial and signed-session gated.
- Dashboard returns explicit `policyPending` for royalties/sales/contracts and an `activationGate` with unresolved decision areas.
- `computePublisherRoyalties`, `allocatePublisherSales`, and `createPublisherPayoutInstruction` refuse while the gate is open.
- No invented rates/splits; vendor payout and institution MARC ownership preserved.
- Secrets omitted from public responses and structured events.

Verdict: approve for ready_to_test under session routine-acceptance standing order.
