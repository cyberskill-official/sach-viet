# Edge-case matrix

| Case | Expected |
|---|---|
| Non-institution role upserts budget | reject Institution access |
| Librarian reads missing budget | reject Budget does not exist |
| Cross-org budget upsert | reject Budget access denied |
| Budget upsert | does not mutate order/quote status |
| Customer submits PO | reject Institution access |
| Public URL storage key on PO | reject |
| Librarian submits PO on awaiting_po | creates purchase_order artifact; status stays awaiting_po; no storage key in response |
| Cross-org PO submit | reject Order access denied |
| Librarian registers MARC | reject B2B staff access |
| Public URL MARC key | reject |
| MARC list before confirmed purchase | empty |
| MARC detail before entitlement | deny |
| Confirmed order product MARC list/detail | list omits storage key; detail returns opaque key |
| Non-purchased product MARC detail | deny |
| Existing institution order blind-read route | unchanged getInstitutionOrder only |
