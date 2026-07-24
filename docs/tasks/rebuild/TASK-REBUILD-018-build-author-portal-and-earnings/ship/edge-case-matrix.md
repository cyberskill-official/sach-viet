# Edge-case matrix

| Case | Expected |
| --- | --- |
| Non-author role creates manuscript | Author access required |
| Public URL storage key | Rejected |
| Cross-author list/detail/withdraw | Rejected |
| Double withdraw | Already withdrawn |
| Dashboard while gate open | policyPending earnings + stages; no amounts |
| Earnings/sales/payout APIs while gate open | Activation gate pending |
| Storage keys in responses/events | Omitted |
| Invented review stages | Forbidden (submitted/withdrawn only) |
