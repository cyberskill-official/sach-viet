# Edge-case matrix

| Condition | Expected outcome | Evidence |
| --- | --- | --- |
| Unsigned actor creates or lists notifications | Server rejects authentication. | `notification-core.test.mjs` |
| User A lists or marks User B notification | Ownership check rejects access. | `notification-core.test.mjs` |
| Preference disables in_app for an event type | createNotification skips persistence. | `notification-core.test.mjs` |
| UserChannel in_app disabled | createNotification skips persistence. | `notification-core.test.mjs` |
| Unknown event type key | createNotification rejects the key. | `notification-core.test.mjs` |
| Mark-read on owned unread notification | Unread badge decreases. | `notification-core.test.mjs` |
| Vendor updates vendor preferences as customer | Vendor role check rejects. | `notification-core.test.mjs` |
| Notification response projection | Omits email, session tokens, payment secrets. | `notification-core.test.mjs` |
| Route has no signed session | Returns authentication error before domain work. | `notification-route.test.mjs` |
| Source verifier | Confirms registry, ownership, and preference gates. | `verify-notification-core.mjs` |
