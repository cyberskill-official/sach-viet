# Cutover checklist — Auth / `app` (NOT executable under 21b)

**Gate:** operator explicit instruction required. All boxes stay unchecked under interim-owner-defaults-2026-08-21b.

- [ ] `DEC-OPS-001` revised to accept Auth / `app` as primary (or follow-on DEC)
- [ ] Staging rehearsal on clone with PITR-aware rollback
- [ ] Dual-write / dual-read evidence attached
- [ ] Session cutover runbook reviewed (revoke `sv_session` schedule)
- [ ] Role grants + `search_path` plan reviewed
- [ ] Operator HITL + deploy instruction recorded (CyberOS)

Until then: **scaffold only**.
