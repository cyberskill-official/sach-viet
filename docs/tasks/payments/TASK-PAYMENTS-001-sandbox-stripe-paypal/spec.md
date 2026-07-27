---
id: TASK-PAYMENTS-001
title: "Enable Stripe test-mode and PayPal sandbox checkout on Production"
template: task@1
type: feature
module: payments
author: "@codex"
department: engineering
status: testing
priority: p0
created_at: "2026-07-28T00:00:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: true
depends_on:
  - TASK-REBUILD-005
source_ref:
  - docs/ops/production-execute-status-2026-07-26.md
  - app/web/src/lib/commerce-core.mjs
  - app/web/OPERATIONS.md
provenance:
  - "source_path: /Users/stephencheng/.cursor/plans/sandbox_stripe_paypal_8af9fa93.plan.md"
  - "operator_resolution: Build = execute plan including Production sandbox wire + redeploy on 2026-07-28"
  - "credentials_source: private DEV-SANDBOX-HANDOFF.md (env names only in git)"
---

# Task

## Summary

Wire Stripe **test-mode** hosted Checkout on Vercel Production and implement PayPal Orders **sandbox** as a second checkout provider. Use only sandbox/test credentials from the private handoff. Never commit secrets or live keys. <!-- authority: human-confirmed -->

## Problem

Greenfield Stripe Checkout + webhook → `paid` already exists, but Production omits `STRIPE_*` (Wave 4 item 6 deferred). PayPal is net-new (`paypal_checkout` deferred). Operators need a proven sandbox paid path on `https://sachviet.cyberskill.world` without live money. <!-- authority: human-confirmed -->

## Proposed Solution

1. Extend `POST /api/checkout` with `provider: "stripe" | "paypal"` (default `stripe`).
2. Add migration `003_payment_provider.sql` (`payment_provider`, `paypal_order_id`).
3. Implement PayPal OAuth + Orders create/capture + return route + webhook with fetch doubles in tests.
4. Cart UI: two CTAs (Stripe / PayPal).
5. Upsert Production sandbox/test env; register webhooks; redeploy; prove paid path.
6. Refuse `sk_live_` / `PAYPAL_MODE=live` in wire helpers where easy. <!-- authority: human-confirmed -->

## Alternatives Considered

Ship live keys on Production. Rejected — operator unlock is sandbox/test only. <!-- authority: human-confirmed -->

PayPal only without Stripe wire. Rejected — Stripe code exists and handoff provides verified test keys. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: Production checkout fails closed without Stripe; PayPal absent. Target: Stripe test card and PayPal sandbox buyer can reach `paid` on Production (or code+wire complete with exact operator residual if registration blocks). Deadline: before testing → done. <!-- authority: human-confirmed -->

Guardrail - baseline: no payment secrets in git. Target: env names only in docs; no `sk_live_` / live PayPal mode accepted by helpers. Deadline: before testing → done. <!-- authority: human-confirmed -->

## Scope

### In scope

- Checkout provider branching; Stripe Production test env + webhook secret registration.
- PayPal sandbox create/capture/return/webhook; cart dual CTAs; migration 003.
- Docs/env examples; ops Stripe row → done (sandbox); parity `paypal_checkout` when proven.
- Focused tests + gates; feature-branch commit + PR (no merge without operator). <!-- authority: human-confirmed -->

### Out of scope

- Live Stripe/PayPal keys or `PAYPAL_MODE=live`.
- Legacy Laravel/Nuxt payment code; coupons; Phase B/C; WP; royalty unlock.
- Self-setting task `done` (HITL required). <!-- authority: human-confirmed -->

## Dependencies

`TASK-REBUILD-005` (cart/checkout/Stripe core). Private handoff for sandbox values (never committed). <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Composer assisted authoring from the approved sandbox payments plan. <!-- authority: human-confirmed -->
- Scope: No live keys or handoff secret values written into the repository. <!-- authority: human-confirmed -->
- Human review: Operator HITL at reviewing → ready_to_test and testing → done. <!-- authority: human-confirmed -->
