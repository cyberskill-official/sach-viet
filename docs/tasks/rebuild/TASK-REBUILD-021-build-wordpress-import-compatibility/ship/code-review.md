# Code review

| Clause | Evidence |
|---|---|
| Fixture schema users/orders | `validateWordpressImportFixture` + tests |
| PHPass login for imported accounts | `verifyPassword` + `$P$` path; login test |
| Legacy ids on users/orders | `legacy_wp_*` columns + apply test |
| Order match via billing email | unmatched when email unresolved |
| dry_run / apply + idempotent | dry_run mutates 0 users/orders; re-apply skips |
| Admin gate | status/apply throw for non-admin |
| No WP runtime / MySQL | verify script + status flags |
| Leave on_hold migration | verify asserts TASK-MIGRATION-001 on_hold |
