# Context map

Touched domain: greenfield live notifications on top of Task 10 inbox under `app/web`.

- Identity: `src/lib/auth-core.mjs`
- Existing inbox: `src/lib/notification-core.mjs` (publish hook after create)
- New core: `src/lib/live-notifications-core.mjs`
- Route: `/api/notifications/stream`
- Tests + verify: `tests/live-notifications-*.test.mjs`, `scripts/verify-live-notifications-core.mjs`
- Out of cone: Pusher, Reverb, WebSocket servers, email/Zalo, multi-node brokers, deployment
