---
id: DEC-PRIV-001
title: Privacy jurisdictions, processors, consent, retention, and deletion policy
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
  - FL-PLT-08
  - FL-PLT-09
  - FL-PLT-10
  - FL-PLT-11
  - FL-ID-08
  - FL-ID-09
---

# DEC-PRIV-001

**Interim owner defaults 2026-08-21** — revisable. Supersedes interim-defaults-2026-08-20.

Fills typed retention and export/deletion SLAs for interim automation planning. Counsel may revise.

## Authority (owners fill)

| Role     | Name                           | Date       | Signature                         |
| -------- | ------------------------------ | ---------- | --------------------------------- |
| Owner    | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Counsel  | Deferred — interim TTLs only   | 2026-08-21 | N/A until counsel calendar          |
| Security | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |

## Fields to accept (owners fill; leave blank until signed)

| Field                    | Accepted value | Notes |
| ------------------------ | -------------- | ----- |
| Jurisdictions            | **Vietnam-facing storefront + CyberSkill operator; US+VN commerce scope per COM.** Full multi-country filing deferred with counsel. | — |
| Processors               | **Vercel; Supabase APAC `eskazygpnygqsrcwlszz`; Stripe test; PayPal sandbox; SMTP (e.g. Resend).** Zalo not a processor until OA enabled. | — |
| Consent classes          | **Account + transactional implied; marketing off** (`DEC-COMMS-001`). | — |
| Retention by record type | **Orders / payment ledger: 24 months.** **Application / access logs: 30 days.** Accounts: retain while active + 24 months after close interim. Support tickets: 24 months. | Interim calendar. |
| Export                   | **30-day SLA** for operator/manual or productized export after verified request. | — |
| Deletion                 | **30-day SLA** for deletion/anonymization request after verification; financial rows may soft-hold under legal hold. | — |
| Anonymization            | **Interim: preferred path for logs after 30d; order PII anonymize after retention if deletion requested.** | — |
| Legal hold               | **Operator may freeze rows manually**; suspend purge/deletion. | — |
| Moderation               | **Deferred** beyond support/admin roles. | — |
| Audit access             | **`admin` + CyberSkill operators.** | — |

## Accepted values

**Version:** interim-owner-defaults-2026-08-21  
**Processors:** Vercel, Supabase APAC, Stripe test, PayPal sandbox, SMTP.  
**Retention:** orders 24 months; logs 30 days (interim).  
**Export SLA:** 30 days.  
**Deletion SLA:** 30 days (with legal-hold exception).  
**Marketing consent:** off.

## Explicit non-values

Do not invent GDPR multi-jurisdiction filings or processors beyond the accepted list. Owner/counsel may revise TTLs.

## History

- **2026-08-20:** retention day calendar deferred.
- **2026-08-21:** interim-owner-defaults — 24m orders / 30d logs; 30d export/deletion SLA.
