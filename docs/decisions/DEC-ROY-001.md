---
id: DEC-ROY-001
title: Royalty rates, splits, recognition, and statement policy
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
  - FL-PUB-07
  - FL-PUB-08
  - FL-AUT-07
  - FL-AUT-08
  - PKG-61
---

# DEC-ROY-001

**Interim owner defaults 2026-08-21** — revisable. Supersedes interim-defaults-2026-08-20 (full deferral).

Unlocks royalty **statement compute** for sandbox/staging using interim rates. Portal shells may show computed previews; not final legal contracts.

## Authority (owners fill)

| Role    | Name                           | Date       | Signature                         |
| ------- | ------------------------------ | ---------- | --------------------------------- |
| Owner   | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Finance | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Counsel | Deferred — interim rates only  | 2026-08-21 | N/A until counsel review            |

## Fields to accept (owners fill; leave blank until signed)

| Field                                | Accepted value | Notes |
| ------------------------------------ | -------------- | ----- |
| Product / contract / recipient links | **Interim: product → author (or publisher org) as payee when catalog linkage exists;** missing link → exclude from compute with note. | Shells may wire later. |
| Rates / splits                       | **Author royalty 10% of net line (USD)** interim when author is payee. Publisher share: **deferred / 0% separate split** unless owner revises. | Single-rate interim. |
| Recognition                          | **On payment (`paid`)** — not delivery. | Align sandbox orders. |
| Returns treatment                    | **Approved returns reduce royalty** for the returned line in the period of return approval (`DEC-RET-001`). | After RET. |
| Advances                             | **No advances** (interim). | — |
| Reserves                             | **0% reserve** (interim). | — |
| Periods                              | **Quarterly** calendar quarters (UTC). | — |
| Currency                             | **USD** (align `DEC-COM-001`). | — |
| Tax                                  | **Deferred withholding;** marketplace tax = 0 per COM. | — |
| Statements                           | **Quarterly statement summary** (period, gross, returns, net royalty). | — |
| Payout                               | **Manual/sandbox** rail after admin approval; threshold align SET spirit ($50) interim. | Distinct from vendor SET. |
| Disputes                             | **Admin freeze + support ticket** interim. | — |

## Accepted values

**Version:** interim-owner-defaults-2026-08-21  
**Rate:** 10% of net (USD) to author payee.  
**Recognition:** paid.  
**Advances / reserves:** none / 0%.  
**Period:** quarterly.  
**Currency:** USD.  
**Returns:** reduce royalty on approved return.  
**Payout:** manual/sandbox after approval.

## Explicit non-values

Do not invent multi-party split tables beyond the 10% author interim, advances, or live tax withholding. Owner may revise.

## History

- **2026-08-20:** full deferral — no royalty rate; currency USD noted.
- **2026-08-21:** interim-owner-defaults — 10% author / quarterly / no advances.
