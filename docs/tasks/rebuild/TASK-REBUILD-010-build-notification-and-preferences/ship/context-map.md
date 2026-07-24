# Context map

Touched domain: greenfield notification inbox and preferences under `app/web`.

- Identity: `src/lib/auth-core.mjs`, `src/lib/access.mjs`
- New core: `src/lib/notification-core.mjs`
- Routes: `/api/notifications`, `/api/notifications/preferences`, `/api/notifications/[id]/read`, `/api/vendor/notification-preferences`
- Tests + verify: `tests/notification-*.test.mjs`, `scripts/verify-notification-core.mjs`
- Out of cone: live transport, email/Zalo delivery, legacy recovery
