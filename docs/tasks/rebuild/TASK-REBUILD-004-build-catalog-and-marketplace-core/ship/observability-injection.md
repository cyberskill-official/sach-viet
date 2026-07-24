# Observability injection plan

Catalog reads emit no per-request event. Offer writes emit structured events with the task ID, action result, actor role, and safe identifiers. Events never include session tokens, email addresses, prices, media URLs, or request bodies.
