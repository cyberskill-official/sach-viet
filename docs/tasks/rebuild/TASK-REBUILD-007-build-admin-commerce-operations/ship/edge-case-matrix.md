# Edge-case matrix

| Condition | Expected outcome | Evidence |
| --- | --- | --- |
| Non-admin requests dashboard or application queue | Server rejects access. | `admin-commerce-core.test.mjs` |
| A paid and pending order exist | Revenue includes only the paid subtotal. | `admin-commerce-core.test.mjs` |
| A customer applies to be a vendor | A pending application is retained. | `admin-commerce-core.test.mjs` |
| Rejection has no reason | The decision is rejected. | `admin-commerce-core.test.mjs` |
| Approval targets an eligible customer | The user role becomes vendor. | `admin-commerce-core.test.mjs` |
| An application is resolved twice | The second decision is rejected. | `admin-commerce-core.test.mjs` |
| A staff or admin account applies | The application is rejected. | `admin-commerce-core.test.mjs` |
| A route has no signed session | It returns an authentication error before a domain operation. | `admin-commerce-route.test.mjs` |
