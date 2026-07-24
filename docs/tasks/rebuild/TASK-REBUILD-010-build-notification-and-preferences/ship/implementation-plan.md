# Implementation plan

1. Add SQLite notification tables: event types, notifications, user/vendor preferences, and user channels.
2. Seed at least ten source-grounded event-type keys and gate in-app creation through preferences plus the `in_app` channel.
3. Expose owner-only list, unread badge, mark-read, and preference/channel updates under signed sessions.
4. Wire routes, tests, and a source verifier into package verify.
