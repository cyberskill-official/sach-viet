# Edge-case matrix

| Condition | Expected outcome | Evidence |
| --- | --- | --- |
| Non-employee requests employee dashboard | Server rejects access. | `employee-retail-core.test.mjs` |
| Vendor requests employee dashboard | Server rejects access. | `employee-retail-core.test.mjs` |
| Employee dashboard with mixed paid and unpaid orders | Paid count includes only paid orders. | `employee-retail-core.test.mjs` |
| Approval queue lists pending applications | Queue omits customer email. | `employee-retail-core.test.mjs` |
| Customer writes a home section | Server rejects access. | `employee-retail-core.test.mjs` |
| Employee writes an invalid section key | Snake-case validation rejects the key. | `employee-retail-core.test.mjs` |
| Employee creates then admin updates a home section | Upsert updates the existing key. | `employee-retail-core.test.mjs` |
| Generic employee lists retail orders | Server rejects retail access. | `employee-retail-core.test.mjs` |
| `employee_b2c` lists retail orders | Orders omit email and payment secrets. | `employee-retail-core.test.mjs` |
| Route has no signed session | It returns an authentication error before a domain operation. | `employee-retail-route.test.mjs` |
