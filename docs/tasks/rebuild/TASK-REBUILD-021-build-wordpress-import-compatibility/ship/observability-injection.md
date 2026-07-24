# Observability injection

Structured events (no passwords, no full hashes):

- `wordpress_import_run_started` / `wordpress_import_run_completed` with mode, counts
- `wordpress_import_item` outcomes: `accepted` | `skipped_duplicate` | `unmatched` | `rejected`
- Auth login continues existing `auth_login_*` events without credential fields
