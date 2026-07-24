# Edge-case matrix

| ID | Case | Expected | Coverage |
|---|---|---|---|
| ECM-001 | Query without diacritics (`tieng viet`) | Matches accented title | `vietnamese-search-core.test.mjs` |
| ECM-002 | `đ` / `Đ` in text | Folds to `d` | normalize test |
| ECM-003 | Empty / whitespace `q` | Existing list/category behavior; no search_log | empty-q test |
| ECM-004 | Short typo / prefix token | Still ranks related titles | typo/prefix tests |
| ECM-005 | Suggestions prefix | Returns prior logs + title prefixes | suggestions test |
| ECM-006 | No MEILI_HOST | Local backend; no network | resolve/status tests |
| ECM-007 | MEILI_HOST without submitter | Meilisearch mode, local fallback, no socket | Meilisearch seam test |
| ECM-008 | Injected Meilisearch submitter | Returns injected hits | Meilisearch submit test |
| ECM-009 | Private data | Not indexed (public catalog only) | scope + verify script |
| ECM-010 | Paid SaaS SDK strings | Rejected by verify script | verify-vietnamese-search-core.mjs |
