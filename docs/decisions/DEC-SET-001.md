---
id: DEC-SET-001
title: Vendor settlement, commission, and payout policy
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-20"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
blocks:
  - FL-VEN-08
  - FL-ADM-08
  - PKG-31
---

# DEC-SET-001

**Interim defaults — owner may revise; supersedes unsigned empty body.**

**Accepted value = explicit deferral until Phase 5 (finance — settlement).** No commission rate, reserve, or payout threshold is invented.

## Authority (owners fill)

| Role    | Name                           | Date       | Signature                   |
| ------- | ------------------------------ | ---------- | --------------------------- |
| Owner   | CyberSkill operator (interim)  | 2026-08-20 | interim-defaults-2026-08-20 |
| Finance | Deferred until Phase 5         | 2026-08-20 | N/A until rates accepted    |
| Counsel | Deferred until Phase 5         | 2026-08-20 | N/A until rates accepted    |

## Fields to accept (owners fill; leave blank until signed)

| Field              | Accepted value | Notes |
| ------------------ | -------------- | ----- |
| Vendor eligibility | **Deferred until Phase 5.** Vendor orgs/offers may exist; settlement eligibility policy not accepted. | — |
| Commission         | **Deferred — no commission rate accepted yet.** | Required before `PKG-31`. |
| Provider fees      | **Deferred.** Stripe/PayPal fee pass-through not accepted as product policy. | Sandbox fees ≠ accepted policy. |
| Tax treatment      | **Align interim with `DEC-COM-001`:** marketplace tax not charged; settlement tax treatment deferred. | — |
| Reserve            | **Deferred — no reserve % or hold days accepted.** | — |
| Cadence            | **Deferred — no weekly/monthly payout cadence accepted.** | — |
| Threshold          | **Deferred — no minimum payout amount accepted.** | — |
| Bank / rail        | **Deferred.** No payout rail (ACH, bank file, PayPal Payouts) accepted. | — |
| Approvals          | **Deferred.** Separation-of-duties approvers named at Phase 5. | — |
| Failed transfer    | **Deferred.** | — |
| Reversals          | **Deferred.** | — |
| Disputes           | **Deferred.** | — |

## Accepted values

**Version:** interim-defaults-2026-08-20  
**Policy:** Vendor settlement, commission, reserves, cadence, thresholds, and payout rails are **deferred until Phase 5**; **no commission rate accepted yet.** `PKG-31` and settlement flags stay off until this DEC is revised with concrete finance values.

## Explicit non-values

Do not invent commission percentages, reserve holds, or payout thresholds from this interim record.
