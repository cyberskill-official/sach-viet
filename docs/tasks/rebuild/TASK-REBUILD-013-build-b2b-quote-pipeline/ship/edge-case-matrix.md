# Edge-case matrix

| Case | Expected |
|---|---|
| Customer creates organization | Reject — B2B staff only |
| Librarian without membership | Reject selection-list/quote ops |
| Empty selection list → quote | Reject |
| Cross-org quote read | Denied |
| Invalid status jump (sent→won) | Reject |
| Price set after won/lost | Reject |
| Institution quote JSON | No vendor/supplier/createdBy |
| Staff pipeline | Grouped by closed statuses |
