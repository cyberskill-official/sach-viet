# Implementation plan

1. Add `institution-buyer-core.mjs` with informational budgets, institution PO artifact submission into existing `b2b_artifacts`, and entitlement-gated private MARC metadata.
2. Wire signed-session institution budget/PO/MARC routes and staff MARC registration without rewriting quote/order cores or blind-read handlers.
3. Tests + `verify-institution-buyer-core.mjs`; wire into `npm run verify`.
