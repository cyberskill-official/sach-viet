# Observability injection

Structured events use `task_id` via catalog store log wrappers and search-specific events (`vietnamese_search_local`, `vietnamese_search_logged`, Meilisearch seam events). Payloads carry backend mode, normalized query, and result count — never session tokens or private account/order fields.
