# Implementation plan

1. Add PHPass verify (and fixture hasher) plus optional legacy column ensure helpers.
2. Extend `verifyPassword` to accept `$P$`/`$H$` without changing scrypt behavior.
3. Add `wordpress-import-core` with fixture schema, dry_run/apply, idempotent legacy ids, import run/outcome rows, admin status.
4. Wire admin GET status + POST apply routes.
5. Add core/route tests and verify script forbidding WP runtime / MySQL client defaults.
