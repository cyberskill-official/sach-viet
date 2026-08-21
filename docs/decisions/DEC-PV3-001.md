---
id: DEC-PV3-001
title: Controlled live Stripe and PayPal verification
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-21"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
  - docs/ops/next-dec-revisions-checklist-2026-08-21.md
  - docs/ops/dec-accepted-values-owner-defaults-2026-08-21b.md
  - app/web/src/lib/commerce-core.mjs
blocks:
  - Production live-payment verification
  - PKG-81
  - PKG-82
---

# DEC-PV3-001

**Interim owner defaults 2026-08-21b** — revisable. **Default remains sandbox; live still refused.**

Reaffirms: live payments **not authorized**. Maximum live test amount = **not authorized** (including `$0` live charges). **Sandbox-only PV3 complete** evidence procedures **are** authorized (scripts / TC matrix / operator checklist) — not Production live keys. This is **not** PV3 go.

## Authority (owners fill)

| Role    | Name                           | Date       | Signature                            |
| ------- | ------------------------------ | ---------- | ------------------------------------ |
| Owner   | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21b   |
| Finance | Deferred until live PV3 go    | 2026-08-21 | N/A until live amount set             |

## Fields to accept (owners fill; leave blank until signed)

| Field                    | Accepted value | Notes |
| ------------------------ | -------------- | ----- |
| Maximum live test amount | **Not authorized — including `$0` live test.** Live PV3 refused. | Do not invent a $ cap. |
| Controlled accounts      | **Sandbox Stripe/PayPal test accounts only** (env secrets). None for live. Do **not** set live Stripe/PayPal keys in Vercel. | Never write `sk_live_` anywhere. |
| Refund authority         | **Deferred for live.** Sandbox refunds only. | — |
| Accounting label         | **Sandbox / test-mode only** — not Production live revenue. | — |
| Abort rule               | **Refuse any live credential:** reject `sk_live_*`, reject `PAYPAL_MODE=live`. | Codifies fail-closed. |
| Sandbox PV3 evidence     | **Authorized:** sandbox-only complete evidence procedures (staging scripts, TC matrix rows, operator gate checklist). Future live go still needs a separate operator gate. | Docs/scripts only — no live keys. |
| Stripe reviewer          | **Deferred** until live go. | — |
| PayPal reviewer          | **Deferred** until live go. | — |

## Accepted values

**Version:** interim-owner-defaults-2026-08-21b  
**Mode:** **sandbox only** (`sk_test_…`, `PAYPAL_MODE=sandbox`).  
**Live Stripe / PayPal:** **forbidden** (no Vercel live keys; no `sk_live_` in repo or env docs).  
**Max live test amount:** **not authorized** (incl. `$0` live).  
**Sandbox PV3 complete evidence:** **authorized** (procedures / scripts / checklist only).  
**Abort:** fail closed on live keys/mode.  
**This DEC is not “PV3 = go.”**

## Explicit non-values

Do not invent live charge amounts, enable live API keys, set Vercel Production live secrets, or treat Production promote as live-pay authorization. Sandbox evidence authorization does **not** unlock live go.

## History

- **2026-08-20:** live refused; sandbox only.
- **2026-08-21:** interim-owner-defaults — reaffirm sandbox; max live test still not authorized.
- **2026-08-21b:** authorize sandbox-only PV3 complete evidence procedures; reaffirm live refused incl. `$0` live test; no Vercel live keys.
