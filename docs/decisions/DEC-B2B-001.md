---
id: DEC-B2B-001
title: B2B quote, contract, PO, invoice, and payment-terms policy
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
  - FL-B2B-03
  - FL-B2B-04
  - FL-B2B-05
  - FL-B2B-06
  - FL-B2B-07
  - FL-B2B-08
  - FL-B2B-09
  - FL-INS-04
  - FL-INS-05
  - FL-INS-06
  - FL-INS-07
  - FL-INS-08
  - FL-INS-09
---

# DEC-B2B-001

**Interim owner defaults 2026-08-21** — revisable. Supersedes interim-defaults-2026-08-20.

Aligns tax/shipping with `DEC-COM-001` and fills quote validity, discount authority, and Net-N for portal wiring.

## Authority (owners fill)

| Role    | Name                           | Date       | Signature                         |
| ------- | ------------------------------ | ---------- | --------------------------------- |
| Owner   | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| B2B     | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Finance | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Counsel | Deferred — interim terms only  | 2026-08-21 | N/A until contract counsel          |

## Fields to accept (owners fill; leave blank until signed)

| Field                    | Accepted value | Notes |
| ------------------------ | -------------- | ----- |
| Quote validity           | **30 days** from quote issue (`createdAt` + 30d). Expired quotes cannot convert without re-issue. | Unlocks SLA claims interim. |
| Discount authority       | **Admin-only; max 20%** off quote subtotal. Non-admin cannot set discounts. | Do not invent deeper ladders. |
| Contract / PO fields     | **Interim: keep current artifact association fields** (upload/link as implemented). | — |
| Signatures               | **Deferred** e-sign; admin acceptance of quote state is operational acceptance interim. | — |
| Tax                      | **0 / not charged (interim)** — align `DEC-COM-001`. | — |
| Shipping                 | **None / $0** — align `DEC-COM-001`. | — |
| Invoice and credit terms | **Net-30** interim; **no credit limit** accepted yet; **no late fee** accepted yet. Currency: USD. | — |
| Payment evidence         | **Interim: admin marks invoice paid** with optional note/reference; sandbox card paths not required for B2B. | — |
| Partial delivery         | **Deferred.** | — |
| MARC license             | **Deferred commercial license fees.** Entitlement-gated MARC delivery as implemented. | — |

## Accepted values

**Version:** interim-owner-defaults-2026-08-21  
**Currency:** USD.  
**Tax / shipping:** tax 0; shipping none/$0 (align COM).  
**Quote validity:** 30 days.  
**Discount:** admin-only, max 20%.  
**Invoice terms:** Net-30; no credit limit / late fee yet.  
**Blind brokerage:** remains in force.

## Explicit non-values

Do not invent discount ladders beyond admin max 20%, credit limits, late fees, or tax tables.

## History

- **2026-08-20:** Net-N / discount / validity deferred.
- **2026-08-21:** interim-owner-defaults — 30d validity, admin max 20%, Net-30.
