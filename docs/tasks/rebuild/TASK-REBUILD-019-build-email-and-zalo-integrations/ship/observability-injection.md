# Observability injection

Structured events use `task_id: TASK-REBUILD-019` on delivery attempts and verify script output. Payloads carry notification id, channel, outcome, optional reason, and recipient hash only — never session tokens, raw emails, SMTP passwords, Zalo tokens, request bodies, or payment secrets.
