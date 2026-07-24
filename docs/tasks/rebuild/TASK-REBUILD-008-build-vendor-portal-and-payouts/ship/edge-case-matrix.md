# Edge-case matrix

| Condition | Expected outcome | Evidence |
| --- | --- | --- |
| Non-vendor requests vendor orders | Server rejects access. | `vendor-commerce-core.test.mjs` |
| Vendor requests another vendor's records | Server rejects the cross-vendor read. | `vendor-commerce-core.test.mjs` |
| Vendor lists incoming orders for a shared multi-vendor order | Only that vendor's line items are returned. | `vendor-commerce-core.test.mjs` |
| Vendor dashboard includes paid and unpaid lines | Paid line totals count only paid order lines. | `vendor-commerce-core.test.mjs` |
| Non-admin creates a payout | Server rejects access. | `vendor-commerce-core.test.mjs` |
| Admin payout omits amountUsd | Money validation rejects the request. | `vendor-commerce-core.test.mjs` |
| Admin payout references another vendor's order item | Server rejects the foreign item. | `vendor-commerce-core.test.mjs` |
| Admin payout reuses an already settled order item | Unique constraint path rejects the item. | `vendor-commerce-core.test.mjs` |
| Vendor reads payout history | Only that vendor's payouts are returned. | `vendor-commerce-core.test.mjs` |
| Route has no signed session | It returns an authentication error before a domain operation. | `vendor-commerce-route.test.mjs` |
