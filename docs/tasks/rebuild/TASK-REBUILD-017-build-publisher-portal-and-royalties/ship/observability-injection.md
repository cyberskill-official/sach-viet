# Observability injection

Structured events from `publisher-portal-core.mjs` use `task_id: TASK-REBUILD-017` and omit session tokens, emails, request bodies, payment secrets, and storage keys.

| Event | When |
|---|---|
| `publishing_request_created` | publisher submits a catalog/manuscript request |
| `publishing_request_withdrawn` | publisher withdraws a submitted request |
| `publisher_marc_registered` | publisher registers/replaces private MARC metadata |
| `publisher_dashboard_read` | publisher/admin reads dashboard (includes gate status only) |
