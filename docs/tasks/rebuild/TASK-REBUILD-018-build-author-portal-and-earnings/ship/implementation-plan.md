# Implementation plan

1. Add `author-portal-core.mjs` with author manuscript requests, submitted/withdrawn status logs, dashboard, and executable royalty activation-gate refuse paths (reuse Task 17 gate helpers).
2. Add signed-session `/api/author` routes for dashboard, manuscript create/list/detail, and withdraw.
3. Encode policy-pending dashboard placeholders for earnings and expanded stages; refuse earnings/sales/payout financial paths while decision-register acceptance is absent.
4. Add core/route tests and `verify-author-portal-core.mjs`; wire into `npm run verify`.
5. Leave publisher portal scaffolding, `TASK-AUTHOR-001`, `TASK-ROYALTY-001` / `docs/royalty/*`, and vendor payouts unchanged.
