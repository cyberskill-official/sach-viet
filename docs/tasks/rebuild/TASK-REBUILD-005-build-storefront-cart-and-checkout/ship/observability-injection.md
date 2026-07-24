# Observability injection plan

Order creation, checkout-session creation, and payment completion emit only task ID, action result, order ID, item count, and provider. Events omit payment credentials, raw card data, session tokens, email, and webhook payloads.
