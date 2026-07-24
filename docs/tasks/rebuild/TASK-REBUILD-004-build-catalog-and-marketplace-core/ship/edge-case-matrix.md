# Edge-case matrix

| ID | Condition | Expected outcome | Evidence |
| --- | --- | --- | --- |
| ECM-001 | A product is created with price or stock fields | The repository rejects it because offer data cannot live on a product. | `catalog-core.test.mjs` |
| ECM-002 | A product has no active, in-stock offers | The public product read exposes no primary offer. | `catalog-core.test.mjs` |
| ECM-003 | Multiple eligible offers have different prices | The lowest offer price wins the buy box. | `catalog-core.test.mjs` |
| ECM-004 | Eligible offers have the same price | The lexically smallest vendor ID wins deterministically. | `catalog-core.test.mjs` |
| ECM-005 | A lower-priced offer is inactive or out of stock | It cannot win the buy box. | `catalog-core.test.mjs` |
| ECM-006 | A vendor tries to change another vendor's offer | The write is rejected by ownership enforcement. | `catalog-core.test.mjs` |
| ECM-007 | An administrator changes a vendor offer | The write is permitted. | `catalog-core.test.mjs` |
| ECM-008 | A public caller reads the catalog | The route returns catalog facts and the eligible primary offer without an authenticated session. | `catalog-route.test.mjs` |
| ECM-009 | A vendor role writes an offer | The route checks the session and records only a safe mutation event. | `catalog-route.test.mjs` |
