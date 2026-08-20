---
id: DEC-PRIV-001
title: Privacy jurisdictions, processors, consent, retention, and deletion policy
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-20"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
blocks:
  - FL-PLT-08
  - FL-PLT-09
  - FL-PLT-10
  - FL-PLT-11
  - FL-ID-08
  - FL-ID-09
---

# DEC-PRIV-001

**Interim defaults — owner may revise; supersedes unsigned empty body.**

Names **current processors** and an honest interim posture: full GDPR/PDPA retention calendars, automated deletion SLAs, and multi-jurisdiction filing are **deferred** until a dedicated privacy package. Does not invent retention day counts.

## Authority (owners fill)

| Role     | Name                          | Date       | Signature                   |
| -------- | ----------------------------- | ---------- | --------------------------- |
| Owner    | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20 |
| Counsel  | Deferred until privacy package | 2026-08-20 | N/A until calendar accepted |
| Security | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20 |

## Fields to accept (owners fill; leave blank until signed)

| Field                    | Accepted value | Notes |
| ------------------------ | -------------- | ----- |
| Jurisdictions            | **Interim primary operating posture: Vietnam-facing storefront + CyberSkill operator; no multi-country privacy filing accepted.** Full jurisdiction list deferred with counsel. | Not a fake “all ASEAN” claim. |
| Processors               | **Accepted current processors:** Vercel (hosting); Supabase Postgres project `eskazygpnygqsrcwlszz` (APAC); Stripe (test/sandbox only until `DEC-PV3-001`); PayPal (sandbox only until `DEC-PV3-001`); SMTP email provider behind `SMTP_*` (e.g. Resend). Zalo not a processor until OA enabled. | Update if processors change. |
| Consent classes          | **Interim:** account registration + transactional mail implied by use; **marketing consent off** (`DEC-COMMS-001`). Granular consent UI deferred. | — |
| Retention by record type | **Deferred — no day-count calendar accepted yet.** Interim: retain account, order, and payment-ledger rows for ongoing operations and fraud/dispute readiness until owner sets typed TTLs. | Override before automated purge jobs. |
| Export                   | **Deferred productized export** until privacy package; manual operator export acceptable interim. | — |
| Deletion                 | **Deferred self-serve deletion SLA.** Soft-delete / admin inactivation may exist; hard-delete schedule not accepted. Financial/order rows held pending counsel. | — |
| Anonymization            | **Deferred.** | — |
| Legal hold               | **Deferred process; operator may freeze rows manually.** | — |
| Moderation               | **Deferred** beyond existing support/admin role boundaries. | — |
| Audit access             | **Interim: `admin` role and CyberSkill operators.** Immutable audit package still partial (`PKG-07`). | — |

## Accepted values

**Version:** interim-defaults-2026-08-20  
**Processors:** Vercel, Supabase APAC `eskazygpnygqsrcwlszz`, Stripe test, PayPal sandbox, SMTP.  
**Auth:** custom `sv_session` retained until dedicated Auth migration package (not a privacy replacement).  
**Retention / deletion / export calendars:** **deferred** — no invented day counts. Marketing consent off.

## Explicit non-values

Do not invent retention days, deletion SLAs, or processor names beyond the accepted list above.
