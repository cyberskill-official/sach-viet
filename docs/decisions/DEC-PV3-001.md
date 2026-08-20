---
id: DEC-PV3-001
title: Controlled live Stripe and PayPal verification
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-20"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
  - app/web/src/lib/commerce-core.mjs
blocks:
  - Production live-payment verification
  - PKG-81
  - PKG-82
---

# DEC-PV3-001

**Interim defaults — owner may revise; supersedes unsigned empty body.**

**Accepted value = live payments refused.** Sandbox / test-mode only. This signature does **not** authorize `sk_live_`, `PAYPAL_MODE=live`, Production live verification, or “PV3 = go.” A later owner revision + explicit operator deploy instruction is required before any live test amount is accepted.

## Authority (owners fill)

| Role    | Name                          | Date       | Signature                   |
| ------- | ----------------------------- | ---------- | --------------------------- |
| Owner   | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20 |
| Finance | Deferred until live PV3 go    | 2026-08-20 | N/A until live amount set   |

## Fields to accept (owners fill; leave blank until signed)

| Field                    | Accepted value | Notes |
| ------------------------ | -------------- | ----- |
| Maximum live test amount | **None accepted — live PV3 not authorized.** No USD live-test ceiling invented. | Owner must set amount in a future revision before `PKG-81`. |
| Controlled accounts      | **None for live.** Sandbox Stripe/PayPal test accounts only as configured in env (secrets not in git). | — |
| Refund authority         | **Deferred for live.** Sandbox refunds follow provider test tools / code paths only. | — |
| Accounting label         | **Deferred for live.** Sandbox charges are test-mode; not Production live revenue. | — |
| Abort rule               | **Refuse any live credential:** reject `sk_live_*`, reject `PAYPAL_MODE=live` (as enforced in `commerce-core.mjs` / env validators). Abort live verification until this DEC is revised. | Codifies shipped fail-closed. |
| Stripe reviewer          | **Deferred** until live go is accepted. | — |
| PayPal reviewer          | **Deferred** until live go is accepted. | — |

## Accepted values

**Version:** interim-defaults-2026-08-20  
**Mode:** **sandbox only** (`sk_test_…`, `PAYPAL_MODE=sandbox`).  
**Live Stripe / PayPal:** **forbidden** until a later signed revision names maximum live test amount, controlled accounts, refund authority, accounting label, and reviewers — **plus** an explicit operator deploy instruction.  
**Abort:** fail closed on live keys/mode (current code).  
**This DEC is not “PV3 = go.”**

## Explicit non-values

Do not invent live charge amounts, enable live API keys, or treat Production alias/DNS cutover as authorized by this interim record.
