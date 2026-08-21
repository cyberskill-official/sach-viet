---
id: TASK-UI-004
title: "Phase 4 portal depth + hardening under interim DECs"
template: task@1
type: feature
module: portalui
author: "@cursor"
department: engineering
status: done
entered_via: adjusted_completion
priority: p0
created_at: "2026-08-20T11:30:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-COM-003
  - TASK-PLT-002
  - TASK-UI-001
source_ref:
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-30
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-71
  - docs/decisions/DEC-SET-001.md
  - docs/decisions/DEC-ROY-001.md
  - docs/decisions/DEC-B2B-001.md
  - docs/decisions/DEC-PV3-001.md
provenance:
  - "operator_resolution: continue remainings after Phase 3 PR #37 2026-08-20"
---

# Task

## Summary

Ship Phase 4 portal API depth under ocean chrome for operational data that already exists, plus finance scaffolding that **refuses** settlement/royalty rate computation until DEC-SET/ROY revise, TC-matrix progress docs, and staging/prod evidence operator checklist. Honor interim DEC deferrals — no invented %. <!-- authority: llm-explicit -->

## Problem

Tracker Phase 4–6 still lists portal shells, finance packages, and TC/staging evidence as open. Many portal APIs already exist but UI depth, DEC-deferred finance stubs, and operator evidence docs are incomplete. <!-- authority: llm-explicit -->

## Proposed Solution

1. Wire vendor/admin/employee/retail/B2B/institution/publisher/author panels to existing APIs (orders, offers, tickets, pipeline, requests, dashboards, payouts ledger, home sections, budget). <!-- authority: llm-explicit -->
2. Add `finance-policy-core` refuse paths for commission/royalty computation; show deferred banners — no fake rates. <!-- authority: llm-explicit -->
3. Document TC matrix progress + staging/prod evidence checklist (sandbox only; no Production deploy). <!-- authority: llm-explicit -->

## Scope

### In scope

- Portal panel depth; finance refuse scaffolding; TC/evidence docs; tests; tracker update. <!-- authority: llm-explicit -->

### Out of scope

- Inventing SET/ROY/B2B Net-N/RET windows; live Stripe/PayPal; US-region; Auth/`app` cutover; WP DNS; Production deploy; self-setting `done`. <!-- authority: llm-explicit -->

## Success Metrics

Primary: portals show live operational data + honest DEC-deferred finance UX; compute-rate paths refuse; evidence/TC docs land. Guardrail: no invented rates or live keys. <!-- authority: llm-explicit -->
