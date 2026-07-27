# TASK-PAYMENTS-001 ship notes (sandbox wire)

## Status

Task halted at **reviewing** for HITL (`reviewing → ready_to_test`). Agent must not set `done`.

## Production wire (sandbox/test only)

Env names upserted on Vercel Production (values never committed):

- `STRIPE_SECRET_KEY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_MODE`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_RETURN_URL`, `PAYPAL_CANCEL_URL`, `PAYPAL_WEBHOOK_ID`

## Webhooks

| Provider | Endpoint | Registration id (non-secret) |
|---|---|---|
| Stripe (test mode) | `https://sachviet.cyberskill.world/api/webhooks/stripe` | `we_1TxsdjFgUNdFOpT8JqZlXT74` |
| PayPal (sandbox) | `https://sachviet.cyberskill.world/api/webhooks/paypal` | `3PB77907684794213` |

Events: Stripe `checkout.session.completed`; PayPal `CHECKOUT.ORDER.APPROVED` + `PAYMENT.CAPTURE.COMPLETED`.

## Schema

Supabase Production migration `payment_provider` applied (`payment_provider`, `paypal_order_id`).

## Gates

`bash .cyberos/cuo/gates/run-gates.sh` → GREEN (204 tests + doctor).

## Manual proof (2026-07-28)

- Stripe: `POST /api/checkout` (provider stripe) → hosted URL; signed `checkout.session.completed` webhook → order `paid` via `GET /api/orders`.
- PayPal: `POST /api/checkout` (provider paypal) → sandbox approve URL created (buyer capture left for operator UI if desired).
- Deploy: `dpl_6a8ocVWP2dMpnEXrGhzpRpeVBmHu` READY on Production from feature branch.
- Fix landed: Stripe `unit_amount` integer cents (USD rejects 4-dp `unit_amount_decimal`).
