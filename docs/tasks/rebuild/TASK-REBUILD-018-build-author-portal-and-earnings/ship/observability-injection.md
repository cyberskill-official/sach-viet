# Observability injection

Structured events from author portal core:

- `author_manuscript_request_created` — manuscriptRequestId, authorId, status
- `author_manuscript_request_withdrawn` — manuscriptRequestId, authorId, status
- `author_dashboard_read` — authorId, activationGateStatus, financialActivationAllowed

Omissions: session tokens, emails, request bodies, payment secrets, storage keys.
