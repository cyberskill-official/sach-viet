# Edge-case matrix

| Case | Expected |
|---|---|
| External channels disabled (default) | Delivery attempts recorded as `skipped` / `channel_disabled` |
| Email/zalo enabled + recording stub | Attempts `recorded`; no network; recipient hashed |
| Missing SMTP/Zalo credentials | Transport mode stays `recording` |
| SMTP_HOST+SMTP_FROM present | Mode `smtp`; local recorded unless injected submitter |
| ZALO_OA_ACCESS_TOKEN present | Mode `zalo_oa`; local recorded unless injected submitter |
| Non-admin status read | Rejected |
| Admin status read | Non-secret mode + credentialPresence flags only |
| Foreign delivery-attempt list | Access denied |
| Events/rows | Omit raw email, tokens, passwords, session secrets |
| Paid SaaS SDK | Absent (verify + tests) |
