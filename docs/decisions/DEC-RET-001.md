---
id: DEC-RET-001
title: Returns, exchanges, restock, and refund allocation policy
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-21"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
  - docs/ops/next-dec-revisions-checklist-2026-08-21.md
blocks:
  - FL-B2C-12
  - FL-VEN-07
  - FL-RET-04
  - FL-ADM-07
---

# DEC-RET-001

**Interim owner defaults 2026-08-21** — revisable. Supersedes interim-defaults-2026-08-20 (full deferral).

Thin returns product may use these numbers for eligibility/refund stubs. Not final legal policy.

## Authority (owners fill)

| Role    | Name                           | Date       | Signature                         |
| ------- | ------------------------------ | ---------- | --------------------------------- |
| Owner   | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Support | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Finance | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Counsel | Deferred — interim only        | 2026-08-21 | N/A until counsel review           |

## Fields to accept (owners fill; leave blank until signed)

| Field                 | Accepted value | Notes |
| --------------------- | -------------- | ----- |
| Return eligibility    | **Interim: physical defects / damage / wrong-item only** for paid orders. Digital / no-ship lines: support-assisted only, same window. Change-of-mind **out of scope**. | Thin product stubs OK. |
| Evidence requirements | **Photo optional** (encouraged for defects; not hard-required for interim stub). Receipt/order id required (order id in system). | — |
| Labels                | **N/A** under no-carrier interim (`DEC-COM-001`). No RMA carrier labels. | Revisit with carriers. |
| Inspection rules      | **Interim: staff/admin marks inspected → approve or deny.** No formal checklist template. | — |
| Restock rules         | **Restocking fee 0%.** Restock inventory only when return approved and item received/confirmed (or digital revoke). | — |
| Refund allocation     | **Full refund of paid line amount to original payment method** (sandbox provider path or manual ledger stub). Tax/shipping = 0 so no tax-split. | Align COM tax 0. |
| Timing                | **14 days** from `paid` (or `delivered` when fulfillment status exists; else `paid`). | Window days for `FL-B2C-12`. |
| Exchanges             | **Deferred / out of scope** — refund + re-order only interim. | — |
| Damage / loss         | **Covered under eligibility (defect/damage)** within 14-day window; no separate loss schedule. | — |

## Accepted values

**Version:** interim-owner-defaults-2026-08-21  
**Eligibility:** defects / damage / wrong-item; change-of-mind out of scope.  
**Timing:** 14 days from delivery if present, else paid.  
**Evidence:** photo optional; order id required.  
**Restock fee:** 0%.  
**Refund:** original method; full line amount.  
**Exchanges:** deferred.

## Explicit non-values

Do not invent restock fees > 0, exchange SKUs, or multi-currency refund splits. Live provider refunds still gated by `DEC-PV3-001` (sandbox only).

## History

- **2026-08-20:** full deferral — no window/fee/%.
- **2026-08-21:** interim-owner-defaults — 14-day defect window, restock 0%, original-method refund.
