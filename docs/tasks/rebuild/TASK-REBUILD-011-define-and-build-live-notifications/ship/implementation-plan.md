# Implementation plan

1. Define authenticated SSE as the greenfield live transport decision.
2. Add an in-process live bus with cursor encoding, owner resume, heartbeat, and SSE framing.
3. Publish from successful `createNotification` into the owner bus with unread counts.
4. Expose signed-session `GET /api/notifications/stream` and wire tests plus verify into package scripts.
