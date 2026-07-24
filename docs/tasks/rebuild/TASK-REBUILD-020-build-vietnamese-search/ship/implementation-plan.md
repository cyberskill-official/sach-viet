# Implementation plan

1. Add `vietnamese-search-core` with diacritic folding, local ranking, search_logs, suggestions.
2. Add closed SearchBackend: local default + optional env-gated Meilisearch HTTP seam (injected submitter).
3. Wire `GET /api/catalog/products` optional `q` and `GET /api/catalog/search/suggestions`.
4. Add core/route tests + verify script forbidding paid SaaS lock-in and default network I/O.
