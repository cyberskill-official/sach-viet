# Edge-case matrix

| Condition | Expected outcome | Evidence |
| --- | --- | --- |
| Unsigned actor opens stream | Authentication required. | `live-notifications-core.test.mjs` |
| User A subscribed while User B notified | Only owner receives the live payload. | `live-notifications-core.test.mjs` |
| Cursor resume after first notification | Only newer owner-scoped rows replay. | `live-notifications-core.test.mjs` |
| Foreign user notifications | Never appear in owner cursor replay. | `live-notifications-core.test.mjs` |
| SSE live create while stream open | Stream emits notification frame with unreadCount. | `live-notifications-core.test.mjs` |
| Live payload projection | Omits email, session tokens, payment secrets. | `live-notifications-core.test.mjs` |
| Invalid cursor | Decode rejects. | `live-notifications-core.test.mjs` |
| Stream route without session | 401 before domain work. | `live-notifications-route.test.mjs` |
| Source verifier | Confirms SSE route, publish hook, and provider exclusions. | `verify-live-notifications-core.mjs` |
