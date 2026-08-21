---
id: DEC-COMMS-001
title: Email provider, mandatory events, templates, and Zalo OA policy
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-21"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
  - docs/ops/next-dec-revisions-checklist-2026-08-21.md
  - app/web/src/lib/email-zalo-integrations-core.mjs
  - app/web/OPERATIONS.md
blocks:
  - FL-PLT-05
  - transactional release gate
---

# DEC-COMMS-001

**Interim owner defaults 2026-08-21** — revisable. Supersedes interim-defaults-2026-08-20.

**Keep SMTP.** **Zalo OA still deferred** — no OA id invented.

## Authority (owners fill)

| Role      | Name                           | Date       | Signature                         |
| --------- | ------------------------------ | ---------- | --------------------------------- |
| Owner     | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Marketing | Deferred (marketing off)      | 2026-08-21 | N/A                                 |
| Support   | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Privacy   | Align `DEC-PRIV-001`          | 2026-08-21 | interim-owner-defaults-2026-08-21 |

## Fields to accept (owners fill; leave blank until signed)

| Field                   | Accepted value | Notes |
| ----------------------- | -------------- | ----- |
| Email provider / domain | **SMTP** via Production env (`SMTP_HOST`, `SMTP_FROM`; Resend-compatible). Domain = whatever `SMTP_FROM` is in secrets — not invented here. | — |
| Reply-to                | **Same as `SMTP_FROM`** unless operator sets distinct later. | — |
| Mandatory events        | **Identity:** register verify + password reset. **Orders:** paid-order confirmation. Optional interim: return-status notice when RET workflow emits. | — |
| Marketing consent       | **Marketing email off.** | — |
| vi / en templates       | **Interim minimal** as implemented; full branded pack deferred. | — |
| Retry / dead-letter     | **Keep leased outbox** as shipped. | — |
| Bounce / suppression    | **Deferred** until bounce webhooks owned. | — |
| Zalo OA policy          | **Disabled / deferred.** No OA id. No Zalo channel activation. | Do not invent OA id. |

## Accepted values

**Version:** interim-owner-defaults-2026-08-21  
**Email:** SMTP via env (Resend-compatible); From = `SMTP_FROM`.  
**Mandatory:** identity verify/reset + paid-order confirmation.  
**Marketing:** off.  
**Zalo OA:** refused / deferred — **no OA id**.  
**Templates:** interim minimal.

## Explicit non-values

Do not invent sender domains, SPF/DKIM, or Zalo OA ids/approval from this record.

## History

- **2026-08-20:** SMTP accepted; Zalo deferred.
- **2026-08-21:** interim-owner-defaults — reaffirm SMTP; Zalo still deferred (no OA id).
