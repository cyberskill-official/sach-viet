# Implementation plan

1. Add `email-zalo-integrations-core.mjs` with recording stubs, optional SMTP/Zalo OA seams, delivery-attempt trail, and admin status.
2. Extend Task 10 preference helpers for `email`/`zalo` channel toggles; hook dispatch after successful `createNotification`.
3. Add signed-session admin `GET /api/admin/integrations/status`.
4. Add core/route tests and `verify-email-zalo-integrations-core.mjs`; wire into `npm run verify`.
5. Leave Task 11 SSE, on-hold email/integration tasks, publisher/author portals, and royalty gate intact.
