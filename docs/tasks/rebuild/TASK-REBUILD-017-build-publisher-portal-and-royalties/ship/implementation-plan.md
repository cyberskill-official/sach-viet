# Implementation plan

1. Add `publisher-portal-core.mjs` with publishing requests, publisher MARC metadata, dashboard, and executable royalty activation gate.
2. Add signed-session `/api/publisher` routes for dashboard, publishing requests (create/list/withdraw), and MARC register/list.
3. Encode policy-pending dashboard placeholders and refuse royalty/sales/payout financial paths while decision-register acceptance is absent.
4. Add core/route tests and `verify-publisher-portal-core.mjs`; wire into `npm run verify`.
5. Leave vendor payout, institution MARC, `TASK-PUBLISHER-001`, and `TASK-ROYALTY-001` / `docs/royalty/*` unchanged.
