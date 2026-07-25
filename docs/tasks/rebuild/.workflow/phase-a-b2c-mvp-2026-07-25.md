# Phase A confirmed — B2C MVP (2026-07-25)

**Decision:** Operator confirmed **Phase A = B2C MVP** as the production commercial readiness scope.

## In scope for Phase A

- Real customers pay with Stripe (checkout session + signed webhook → `paid`).
- Admin runs catalog / orders / vendor approvals on the greenfield app.
- CapRover (or equivalent) deploy is operable: secrets, TLS, SQLite volume, backup, rollback, owner go.
- Staging catalog via local/fixture seed path; production catalog import strategy documented (not unlocked live WP cutover).
- Transactional order-confirmation email (SMTP when configured; recording stub when unset).

## Explicitly out of scope (do not implement in Phase A)

- CapRover / DNS live production deploy without a separate explicit operator instruction.
- Royalty financials unlock (REBUILD-016 deferral remains).
- WordPress cutover / DNS retirement (`TASK-CUTOVER-001/002` remain on_hold).

## Later — Phase B / C (deferred by plan)

Do **not** implement Phase B (vendor/retail self-serve UI, automated payouts) or Phase C (B2B portals, royalty acceptance, live WP cutover) as part of this readiness work.

Pointer: see plan overview *Production commercial gaps* — Phase B/C are additive after first revenue on greenfield. Revisit only after Phase A blockers (Stripe secrets, authorized deploy, catalog stance, email SMTP) are operator-complete.

## Remaining HITL (operator)

1. Supply CapRover / platform secrets (`AUTH_SESSION_SECRET`, bootstrap admin, Stripe live/test keys + webhook secret, SMTP if desired).
2. Authorize CapRover image deploy, volume, TLS, backup verification, named rollback, and owner go.
3. Choose production catalog path: fixture WP import vs keep `TASK-MIGRATION-001` on_hold for live MySQL.
