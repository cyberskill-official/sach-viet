# Observability injection

Emit structured console events with `task_id: TASK-REBUILD-009`:

- `home_section_created` / `home_section_updated` with `section_id` and `section_key` only
- Never log session tokens, email addresses, request bodies, or payment secrets
