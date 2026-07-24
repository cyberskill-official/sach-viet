# Code review

Section-1 clauses mapped to verification:

| Clause | Evidence |
|---|---|
| Informational budget upsert/read | `institution-buyer-core.test.mjs` budget test; budget route |
| PO submit on awaiting_po without status change | purchase-order submit test; blind read still awaiting_po |
| MARC register + entitlement gate | MARC test; staff/institution marc routes |
| Blind reads / cores intact | route test + verify script checking quote/order cores and blind handler |
| Safe events / no public URLs | core rejects http(s) keys; logs omit storage keys |

No blocking findings.
