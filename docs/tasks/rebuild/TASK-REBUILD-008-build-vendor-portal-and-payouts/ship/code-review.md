# Code review

Every in-scope clause is covered by named tests:

- Vendor-scoped incoming order reads → `vendors read only their incoming order lines and dashboard totals`
- Admin-managed payout with explicit USD amount and eligible order items → `administrators create payouts with explicit amounts and vendors read only their history`
- Cross-vendor and non-admin rejection → same core tests
- Signed-session route wiring → `vendor commerce routes use signed sessions and server-side repository calls`
- No settlement formula / transfer / fulfillment invented → out-of-scope enforced by API surface and tests that require admin-supplied amounts only
