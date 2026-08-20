---
id: DEC-RET-001
title: Returns, exchanges, restock, and refund allocation policy
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-20"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
blocks:
  - FL-B2C-12
  - FL-VEN-07
  - FL-RET-04
  - FL-ADM-07
---

# DEC-RET-001

**Interim defaults — owner may revise; supersedes unsigned empty body.**

**Accepted value = explicit deferral** until Phase 3 returns work. No return window, restock fee, or refund-allocation percentage is invented.

## Authority (owners fill)

| Role    | Name                          | Date       | Signature                     |
| ------- | ----------------------------- | ---------- | ----------------------------- |
| Owner   | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20   |
| Support | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20   |
| Finance | Deferred until returns go-live | 2026-08-20 | N/A until rates accepted      |
| Counsel | Deferred until returns go-live | 2026-08-20 | N/A until rates accepted      |

## Fields to accept (owners fill; leave blank until signed)

| Field                 | Accepted value | Notes |
| --------------------- | -------------- | ----- |
| Return eligibility    | **Deferred until Phase 3.** No customer self-serve return window accepted. Product behavior: returns workflow not enabled for rate-bearing logic. | Override before `FL-B2C-12` / `FL-RET-04` flags on. |
| Evidence requirements | **Deferred.** No photo/receipt evidence rules accepted. | — |
| Labels                | **Deferred / N/A** under no-ship interim (`DEC-COM-001`). No RMA carrier labels. | Revisit with physical shipping. |
| Inspection rules      | **Deferred.** No inspection checklist accepted. | — |
| Restock rules         | **Deferred.** No restock fee %. Inventory restock on pending-order expiry only (commerce TTL) — not a customer return restock policy. | Do not confuse with `PENDING_ORDER_TTL_MS`. |
| Refund allocation     | **Deferred.** No partial/full/tax-split refund allocation accepted. Provider refunds stay gated by sandbox + later `DEC-PV3-001`. | — |
| Timing                | **Deferred.** No “N days after delivery” window accepted. | — |
| Exchanges             | **Deferred / out of scope** until owner accepts exchange SKU rules. | — |
| Damage / loss         | **Deferred.** No damage/loss claim schedule accepted. | — |

## Accepted values

**Version:** interim-defaults-2026-08-20  
**Policy:** All returns, exchanges, restock fees, and refund-allocation rules are **deferred until Phase 3**; **no** window, fee, or allocation % is accepted yet. Dependent flags stay off for rate-bearing returns until this DEC is revised with concrete numbers.

## Explicit non-values

Do not implement restock fees, refund percentages, or return windows from this interim record.
