# Code review

Reviewed against TASK-REBUILD-010 scope:

- Signed-session ownership for inbox, mark-read, and preference writes.
- Closed event-type registry with eleven source-grounded keys.
- Preference and `in_app` channel gates skip persistence instead of delivering.
- No WebSocket/SSE/Reverb/Pusher or email/Zalo send path.
- Responses and events omit session tokens, emails, request bodies, and payment secrets.

Verdict: accept.
