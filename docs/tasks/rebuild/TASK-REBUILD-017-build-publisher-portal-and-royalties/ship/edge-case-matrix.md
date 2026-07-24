# Edge-case matrix

| Case | Expected |
|---|---|
| Non-publisher creates publishing request | reject Publisher access |
| Public URL storage key on request | reject |
| Publisher creates/lists/withdraws own request | success; response omits storage key |
| Cross-publisher withdraw | reject another publisher |
| Withdraw already withdrawn | reject already withdrawn |
| MARC for missing product | reject Product does not exist |
| Public URL MARC key | reject |
| Publisher registers/lists own MARC | list omits storage key; other publisher sees empty |
| Customer reads dashboard | reject Publisher access |
| Dashboard while gate open | non-financial counts + policyPending royalties/sales/contracts; no amountUsd |
| Royalty computation while gate open | reject activation gate pending |
| Sales allocation while gate open | reject activation gate pending |
| Publisher payout instruction while gate open | reject activation gate pending |
| Vendor/institution cores | unchanged ownership |
