---
id: DEC-B2B-001
title: B2B quote, contract, PO, invoice, and payment-terms policy
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-20"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
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

**Interim defaults — owner may revise; supersedes unsigned empty body.**

Codifies interim alignment with `DEC-COM-001` (USD, tax 0, no shipping rates) and **defers** quote validity days, discount authority, Net-N terms, and MARC license commercial terms until Phase 4 B2B depth. Existing quote→order / PO shells are not payment-terms policy.

## Authority (owners fill)

| Role    | Name                          | Date       | Signature                   |
| ------- | ----------------------------- | ---------- | --------------------------- |
| Owner   | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20 |
| B2B     | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20 |
| Finance | Deferred until Phase 4/5      | 2026-08-20 | N/A until Net-N accepted    |
| Counsel | Deferred until Phase 4        | 2026-08-20 | N/A until contract terms    |

## Fields to accept (owners fill; leave blank until signed)

| Field                    | Accepted value | Notes |
| ------------------------ | -------------- | ----- |
| Quote validity           | **Deferred — no N-day validity accepted yet.** Existing quote states may expire in UI without a signed commercial TTL. | Override before institution SLA claims. |
| Discount authority       | **Deferred — no discount % matrix or approver ladder accepted.** | Do not invent % off. |
| Contract / PO fields     | **Interim: keep current artifact association fields only** (upload/link as implemented). No expanded mandatory legal field set accepted. | — |
| Signatures               | **Deferred.** No e-sign vendor or wet-sign rule accepted. | — |
| Tax                      | **0 / not charged (interim)** — align `DEC-COM-001`. | Revise with COM tax. |
| Shipping                 | **None / deferred** — align `DEC-COM-001` no-ship interim. | — |
| Invoice and credit terms | **Deferred — no Net-N, credit limit, or late-fee accepted.** Currency for future invoices: USD. | — |
| Payment evidence         | **Deferred** beyond existing sandbox B2C payment patterns; B2B offline payment evidence rules not accepted. | — |
| Partial delivery         | **Deferred.** | — |
| MARC license             | **Deferred commercial license terms.** Entitlement-gated MARC delivery may remain as implemented; no new license fee accepted. | — |

## Accepted values

**Version:** interim-defaults-2026-08-20  
**Currency:** USD.  
**Tax / shipping:** same interim as `DEC-COM-001` (tax 0; no shipping rates).  
**Commercial terms:** quote validity days, discount authority, Net-N, signatures, partial delivery, and MARC license fees are **deferred until Phase 4** (owner revision). Blind brokerage (hide upstream suppliers from institutions) remains in force as product boundary.

## Explicit non-values

Do not invent discount percents, payment terms (Net-N), tax tables, or shipping rates from this interim record.
