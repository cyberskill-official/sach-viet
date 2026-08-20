---
id: TASK-PLT-002
title: "Phase 2 foundations delta — Storage scaffold, Auth/app-schema plans, observability"
template: task@1
type: feature
module: platform
author: "@cursor"
department: engineering
status: ready_to_review
entered_via: adjusted_completion
priority: p0
created_at: "2026-08-20T09:30:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-PLT-001
  - TASK-GOV-001
source_ref:
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-03
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-05
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-06
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-08
  - docs/decisions/DEC-OPS-001.md
provenance:
  - "operator_resolution: merge then continue Phase 2 foundations 2026-08-20"
---

# Task

## Summary

Ship Phase 2 foundations **delta only** on Vercel + Supabase APAC: Supabase Storage package scaffolding + migration, Auth migration plan (keep `sv_session`), private `app` schema strategy (no cutover), and practical observability fingerprints. Defer US-region per `DEC-OPS-001`. <!-- authority: llm-explicit -->

## Problem

Adjusted tracker Phase 2 still lists Storage, Auth plan, `app` schema strategy, and observability as remaining while interim DECs now allow non-rate foundation work. Forcing Auth or `app` schema cutover would violate `DEC-OPS-001`. <!-- authority: llm-explicit -->

## Proposed Solution

1. Additive migration expanding `stored_objects` metadata for a future private Supabase Storage backend; keep Postgres BYTEA as the active backend. <!-- authority: llm-explicit -->
2. Document Auth and `app` schema migration packages without cutting over. <!-- authority: llm-explicit -->
3. Extend readiness/liveness with release SHA, deployment env, schema name, and storage mode (no secrets). <!-- authority: llm-explicit -->

## Scope

### In scope

- Storage scaffold migration + adapter/docs; Auth plan doc; `app` schema strategy doc; observability on `/api/health` and `/api/ready`. <!-- authority: llm-explicit -->
- Tracker + DEC blocker updates. <!-- authority: llm-explicit -->

### Out of scope

- Supabase Auth cutover, `public` → `app` cutover, US-region move, live payments, tax/shipping invention, Production deploy, self-setting `done`. <!-- authority: llm-explicit -->

## Success Metrics

Primary: Phase 2 delta docs + scaffold landed; ready/health expose safe fingerprints; DB backend still default. Guardrail: no Auth/`app`/US cutover; no live keys. <!-- authority: llm-explicit -->
