# Edge-case matrix

| Case | Expected |
|---|---|
| Customer converts won quote | Reject — B2B staff only |
| Convert draft/sent/negotiating quote | Reject — only won |
| Convert won quote with null unit prices | Reject |
| Duplicate conversion of same quote | Reject — one order per quote |
| Confirm without purchase_order artifact | Reject |
| Artifact storageKey is http(s) URL | Reject |
| Institution JSON | No vendor/supplier/storageKey/createdBy |
| Cross-org institution order read | Denied |
| Cancel after confirmed | Reject |
