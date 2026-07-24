# Edge-case matrix

| Condition | Expected outcome | Evidence |
| --- | --- | --- |
| Ticket subject or request details are empty | The mutation is rejected. | `support-core.test.mjs` |
| A customer accesses another customer's ticket | Read or message creation is rejected. | `support-core.test.mjs` |
| Staff access a ticket queue | An employee can read and reply across the queue. | `support-core.test.mjs` |
| A product context is supplied | The product must exist when catalog records are available. | `support-core.test.mjs` |
| Review rating is outside 1 through 5 | The review is rejected. | `support-core.test.mjs` |
| A review is submitted without a paid matching order item | The review is stored without verified-purchase status. | `support-core.test.mjs` |
| A paid matching order item exists | The review is marked verified purchase. | `support-core.test.mjs` |
| A customer submits more than one ticket message | Each message is retained separately in creation order. | `support-core.test.mjs` |
| A route receives no valid signed session | It responds with an authentication error before a support mutation. | `support-route.test.mjs` |
