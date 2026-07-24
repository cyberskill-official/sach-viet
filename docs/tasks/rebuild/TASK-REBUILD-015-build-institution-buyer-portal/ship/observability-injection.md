# Observability injection

Structured events from the institution buyer store:
- `institution_budget_upserted` — organization_id only
- `institution_purchase_order_submitted` — order_id, artifact_id
- `institution_marc_registered` — product_id
- `institution_marc_fetched` — product_id

All omit session tokens, emails, request bodies, payment secrets, and storage keys.
