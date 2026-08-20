---
id: TASK-COM-003
title: "Phase 3 B2C interim quote/checkout under DEC-COM"
template: task@1
type: feature
module: commerce
author: "@cursor"
department: engineering
status: ready_to_review
entered_via: adjusted_completion
priority: p0
created_at: "2026-08-20T10:00:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-COM-001
  - TASK-COM-002
  - TASK-PLT-002
source_ref:
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-21
  - docs/decisions/DEC-COM-001.md
  - docs/decisions/DEC-RET-001.md
  - docs/decisions/DEC-PV3-001.md
provenance:
  - "operator_resolution: continue Phase 3 B2C interim after DEC #35 and foundations #36 2026-08-20"
---

# Task

## Summary

Ship Phase 3 B2C **interim** quote / cart / checkout completeness under Accepted DEC-COM (USD, tax 0, no shipping, 30m reservation), sandbox-only payments (DEC-PV3), and a thin returns-deferred UX note (DEC-RET). Do not invent tax, shipping, or return rates. <!-- authority: llm-explicit -->

## Problem

Tracker Phase 3 still lists server quote + reservation policy as blocked; interim DECs now codify tax=0 / no-ship / 30m TTL / sandbox. Cart UI estimated totals client-side only; orders omitted `expiresAt` and commerce breakdown. <!-- authority: llm-explicit -->

## Proposed Solution

1. `quoteRetailCart` + `POST /api/quote` with live offer prices, tax/shipping zero, reservation TTL metadata — no stock reserve. <!-- authority: llm-explicit -->
2. Enrich pending order + customer order APIs with tax/shipping/total/expiresAt/returnsPolicy. <!-- authority: llm-explicit -->
3. Wire cart and order detail UI; thin DEC-RET deferred note on cart/account/order. <!-- authority: llm-explicit -->

## Scope

### In scope

- Retail quote API + commerce totals; cart/order UI; tracker update; tests. <!-- authority: llm-explicit -->

### Out of scope

- Taxed retail, carriers, full returns product, live Stripe/PayPal, US-region, Auth/`app` cutover, WP DNS, settlement/royalty rates, deeper vendor portals, Production deploy, self-setting `done`. <!-- authority: llm-explicit -->

## Success Metrics

Primary: quote and checkout paths expose DEC-COM interim totals; 30m TTL visible; sandbox only. Guardrail: no invented rates; returns remain deferred. <!-- authority: llm-explicit -->
