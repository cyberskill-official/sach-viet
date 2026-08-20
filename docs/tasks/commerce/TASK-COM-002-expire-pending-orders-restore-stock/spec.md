---
id: TASK-COM-002
title: "Expire or fail pending orders and restore reserved stock"
template: task@1
type: feature
module: commerce
author: "@cursor"
department: engineering
status: done
entered_via: golive_wave
priority: p0
created_at: "2026-08-13T05:08:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-COM-001
  - TASK-DATA-001
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-21
  - docs/plans/sachviet-full-production-completion-plan.md#FL-B2C-09
provenance:
  - "source_path: docs/plans/sachviet-full-production-completion-plan.md"
  - "source_path: /Users/stephencheng/.cursor/plans/local-complete_golive_wave_1b3ef2a9.plan.md"
  - "operator_resolution: local-complete golive wave 0 2026-08-13"
---

# Task

## Summary

Abandoned `pending_payment` orders must stop locking inventory. Add `orders.expires_at` and optional `inventory_movements`, then expire overdue pending rows to `payment_failed` and restore stock in one transaction via the existing leased cron. A `paid` webhook after expiry is a no-op or 409. <!-- authority: llm-explicit -->

## Problem

The local-complete golive wave records that `createPendingOrder` in `app/web/src/lib/commerce-core.mjs` decrements `stock_quantity` and never increments it, so abandoned pending rows lock inventory. TASK-COM-001 covers reserve-on-insert; this task covers release-on-expiry. Commercial reservation windows stay unsigned in DEC-COM-001. <!-- authority: llm-explicit -->

## Proposed Solution

Additive Postgres migration: `orders.expires_at` plus optional `inventory_movements` (`order_id`, `offer_id`, `delta`, `reason`). A job on the same cron as outbox (`GET /api/cron/drain-order-comms`) selects `pending_payment` past TTL, sets `payment_failed`, and restocks in one transaction. TTL is read from named env/config only; this task does not invent or sign a commercial reservation window (DEC-COM-001). Order states stay `pending_payment | paid | payment_failed`. Tests import cores/handlers, not route source greps. <!-- authority: llm-explicit -->

Routes and authz: existing checkout and webhook handlers plus the leased drain cron; no new public mutate surface. <!-- authority: llm-explicit -->

## Alternatives Considered

Reopen TASK-REBUILD-001…023 or TASK-RETAIL-001. Rejected — those stay done or on_hold; this ID carries the leftover. <!-- authority: llm-explicit -->

Invent tax, shipping rates, commissions, royalty splits, or a signed reservation window. Rejected — those wait on DEC-COM-001. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: pending orders can lock the last unit forever. Target: last-unit checkout, expire, second buyer can buy; `npm test` covers the named tests. Deadline: before reviewing → ready_to_test. <!-- authority: llm-explicit -->

Guardrail - baseline: Production may already be live. Target: no Production deploy, merge, or `seed:local` against Production from this task; no `sk_live_` / `PAYPAL_MODE=live`; no invented finance numbers. Deadline: ongoing. <!-- authority: llm-explicit -->

## Scope

### In scope

- Additive `orders.expires_at` and optional `inventory_movements`. <!-- authority: llm-explicit -->
- TTL job: `pending_payment` past TTL → `payment_failed` + restock in one transaction on the existing leased cron. <!-- authority: llm-explicit -->
- Webhook `paid` after expiry is no-op or 409. <!-- authority: llm-explicit -->
- Tests: last-unit checkout, expire, second buyer can buy; paid-after-expiry. Extend `tests/commerce-core.test.mjs` and `tests/commerce-http.test.mjs` (handler/core imports, not source greps). <!-- authority: llm-explicit -->

### Out of scope

- Signed reservation/cancellation policy (DEC-COM-001), tax, shipping contracts, live Stripe/PayPal, WordPress DNS, self-setting `done`. <!-- authority: llm-explicit -->

## Dependencies

`TASK-COM-001` and `TASK-DATA-001` are the in-flight audit set. This task is eligible only after those complete HITL (`testing → done`). HITL remains required at reviewing → ready_to_test and testing → done. Do not request HITL while authoring. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Cursor agent authoring the local-complete golive wave queue. <!-- authority: llm-explicit -->
- Human review: Operator HITL at the two acceptance gates after implementation. <!-- authority: llm-explicit -->
