---
id: DEC-COMMS-001
title: Email provider, mandatory events, templates, and Zalo OA policy
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-20"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
  - app/web/src/lib/email-zalo-integrations-core.mjs
  - app/web/OPERATIONS.md
blocks:
  - FL-PLT-05
  - transactional release gate
---

# DEC-COMMS-001

**Interim defaults — owner may revise; supersedes unsigned empty body.**

Codifies current Production email path: SMTP via env (`SMTP_HOST`, `SMTP_FROM`, …) — Resend-compatible SMTP wiring as shipped. **Zalo OA remains disabled / deferred** until owner OA approval. Does not invent a public sender domain string if unset in env.

## Authority (owners fill)

| Role      | Name                          | Date       | Signature                   |
| --------- | ----------------------------- | ---------- | --------------------------- |
| Owner     | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20 |
| Marketing | Deferred (marketing off)      | 2026-08-20 | N/A                         |
| Support   | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20 |
| Privacy   | Align `DEC-PRIV-001`          | 2026-08-20 | interim-defaults-2026-08-20 |

## Fields to accept (owners fill; leave blank until signed)

| Field                   | Accepted value | Notes |
| ----------------------- | -------------- | ----- |
| Email provider / domain | **Provider: SMTP submitter** configured by Production env (`SMTP_HOST` + `SMTP_FROM`; Resend SMTP or equivalent). **Domain: whatever `SMTP_FROM` is set to in Vercel Production** — not invented here. Without SMTP, Production outbox stays `failed`, not `delivered`. | Operator sets real From in secrets; do not commit domains. |
| Reply-to                | **Same as `SMTP_FROM` unless operator sets a distinct reply-to later.** No separate reply-to accepted yet. | — |
| Mandatory events        | **Identity:** register verify + password reset. **Orders:** paid-order confirmation (order comms outbox). Other marketing/lifecycle events deferred. | Match leased outbox kinds already shipped. |
| Marketing consent       | **Marketing email off until consent model accepted.** Transactional identity/order mail does not require marketing opt-in. | — |
| vi / en templates       | **Interim: plain-text / minimal templates as implemented** (vi-leaning order body exists; full branded vi/en template pack deferred). | Owner may supply brand templates later. |
| Retry / dead-letter     | **Keep leased outbox behavior as shipped** (retry transient; terminal → failed / dead-letter per worker). No new numeric retry schedule invented beyond current code. | — |
| Bounce / suppression    | **Deferred** until provider webhook bounce handling is owned. | — |
| Zalo OA policy          | **Disabled / deferred.** No Zalo OA activation; no OA id accepted. Channel stays recording/unavailable until owner OA approval (`PV2`). | Resend/SMTP wiring ≠ Zalo policy. |

## Accepted values

**Version:** interim-defaults-2026-08-20  
**Email:** SMTP via Production env (Resend-compatible); From = `SMTP_FROM`.  
**Mandatory:** identity verify/reset + paid-order confirmation.  
**Marketing:** off.  
**Zalo OA:** refused / deferred until owner approval.  
**Templates:** interim minimal; full vi/en brand pack deferred.

## Explicit non-values

This template must not be used as a source of invented sender domains, SPF/DKIM records, or Zalo OA approval.
