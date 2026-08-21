---
id: DEC-SET-001
title: Vendor settlement, commission, and payout policy
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
  - FL-VEN-08
  - FL-ADM-08
  - PKG-31
---

# DEC-SET-001

**Interim owner defaults 2026-08-21** — revisable. Supersedes interim-defaults-2026-08-20 (full deferral).

Unlocks settlement **compute** using these interim rates for sandbox/staging. Does **not** authorize live bank ACH or invented fee pass-through beyond the values below.

## Authority (owners fill)

| Role    | Name                           | Date       | Signature                         |
| ------- | ------------------------------ | ---------- | --------------------------------- |
| Owner   | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Finance | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Counsel | Deferred — interim rates only  | 2026-08-21 | N/A until counsel review            |

## Fields to accept (owners fill; leave blank until signed)

| Field              | Accepted value | Notes |
| ------------------ | -------------- | ----- |
| Vendor eligibility | **Interim: vendors with approved offers and paid order lines** are settlement-eligible. | — |
| Commission         | **15% platform commission** of net line amount (USD), interim. | Required for `PKG-31` compute. |
| Provider fees      | **Interim: platform absorbs sandbox provider fees for display; do not invent live fee %.** Settlement math uses commission only. | Sandbox ≠ live fee policy. |
| Tax treatment      | **Align `DEC-COM-001`:** marketplace tax not charged; settlement on pre-tax (tax=0) line amounts. | — |
| Reserve            | **0% reserve; 0 hold days** (interim). | — |
| Cadence            | **Weekly** settlement batch (calendar week, UTC Monday close interim). | — |
| Threshold          | **$50.00 USD** minimum payout per vendor per cadence. Below threshold rolls forward. | — |
| Bank / rail        | **`manual/sandbox`** — operator records payout on operational ledger; no automated ACH/PayPal Payouts. | — |
| Approvals          | **Admin (or CyberSkill operator) approves payout batch** before marking paid. | — |
| Failed transfer    | **Interim: mark failed; retry next cadence; no auto-reversal of commission.** | — |
| Reversals          | **Interim: admin-only manual adjustment** on ledger; no self-serve. | — |
| Disputes           | **Interim: support ticket + admin freeze** on disputed lines until resolved. | — |

## Accepted values

**Version:** interim-owner-defaults-2026-08-21  
**Commission:** 15% of net line (USD).  
**Reserve:** 0% / 0 days.  
**Cadence:** weekly.  
**Threshold:** $50 USD.  
**Rail:** manual/sandbox.  
**Approvals:** admin/operator before paid.

## Explicit non-values

Do not invent commission rates other than the 15% interim, live ACH rails, or provider-fee pass-through tables. Owner may revise any row.

## History

- **2026-08-20:** full deferral — no commission rate.
- **2026-08-21:** interim-owner-defaults — 15% / reserve 0 / weekly / $50 / manual-sandbox.
