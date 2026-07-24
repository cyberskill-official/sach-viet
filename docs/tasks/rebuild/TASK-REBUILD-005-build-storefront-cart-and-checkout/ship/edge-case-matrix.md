# Edge-case matrix

| Condition | Expected outcome | Evidence |
| --- | --- | --- |
| Cart is empty or quantity is invalid | Order creation is rejected. | `commerce-core.test.mjs` |
| Offer is inactive, empty, or missing | Server rejects the cart item. | `commerce-core.test.mjs` |
| Client changes a price | Server reads the current eligible offer price. | `commerce-core.test.mjs` |
| Stripe variables are absent | Checkout does not start. | `commerce-core.test.mjs` |
| Stripe signature is invalid | Webhook is rejected without an order update. | `commerce-core.test.mjs` |
| Checkout completes | The referenced pending order becomes paid. | `commerce-core.test.mjs` |
| A customer reads orders | Only that signed-in user's orders are returned. | `commerce-core.test.mjs` |
