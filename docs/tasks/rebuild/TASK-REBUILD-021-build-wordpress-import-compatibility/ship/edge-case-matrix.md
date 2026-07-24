# Edge-case matrix

| Case | Expected |
|---|---|
| Fixture user with `$P$` hash | Import stores legacy id; login succeeds with original password |
| Fixture user with `$H$` hash | Same as `$P$` |
| Native scrypt user | Unaffected by PHPass path |
| Order billing email matches imported user + valid total | Order accepted with legacy ids |
| Order billing email unknown | Outcome `unmatched`; no order row in apply |
| Re-apply same legacy user/order ids | `skipped_duplicate`; no duplicate rows |
| `dry_run` mode | Outcomes recorded conceptually / run logged; users and orders unchanged |
| Non-admin status/apply | 403 |
| Unauthenticated | 401 |
| Core default path | No `mysql`, `createConnection`, or WordPress PHP runtime |
| Slug-heuristic rematch | Forbidden; not implemented |
