---
id: TASK-TEST-002
title: "Playwright and next start smoke of FL happy paths"
template: task@1
type: improvement
module: quality
author: "@cursor"
department: engineering
status: implementing
entered_via: golive_wave
priority: p1
created_at: "2026-08-13T05:08:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-TEST-001
  - TASK-UI-002
  - TASK-COM-002
  - TASK-PLT-001
  - TASK-JOB-002
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-72
  - docs/plans/sachviet-full-production-completion-plan.md#FL-ID-01
  - docs/plans/sachviet-full-production-completion-plan.md#FL-B2C-09
provenance:
  - "source_path: docs/plans/sachviet-full-production-completion-plan.md"
  - "source_path: /Users/stephencheng/.cursor/plans/local-complete_golive_wave_1b3ef2a9.plan.md"
  - "operator_resolution: local-complete golive wave 0 2026-08-13"
---

# Task

## Summary

Add Playwright (Chromium only this wave) against `next start` + Compose Postgres for FL happy/denial smokes: register → verify (test-hook token) → login → catalog → sandbox checkout → order list; customer denied vendor offer write; admin login. Keep Node `--test` cores. Do not add source-grep `*-route.test.mjs`. Do not run the full 99×suffix matrix. <!-- authority: llm-explicit -->

## Problem

TASK-TEST-001 adds handler HTTP tests and a hard `smoke:production` gate. `PKG-72` still needs a browser + built-server slice. The golive wave starts that pyramid with Chromium happy/denial paths only, not every `TC-*` suffix. Source-grep route tests must not grow. <!-- authority: llm-explicit -->

## Proposed Solution

Keep existing Node `--test` core/HTTP suites. Add Playwright Chromium against `next start` and Compose Postgres. Cover: register → verify via test-hook token → login → catalog → checkout sandbox stub → order list; vendor offer write denied for customer; admin login. Extend local `smoke:docker` to hit `/api/ready` (TASK-PLT-001). Lint/test/verify/build must be green before review. Refuse `sk_live_` and `PAYPAL_MODE=live`. No merge/deploy from this task. <!-- authority: llm-explicit -->

Routes and authz: exercised through the real app; assertions are HTTP/UI behavior, not source strings. <!-- authority: llm-explicit -->

## Alternatives Considered

Implement the full 99-flow × suffix Playwright matrix now. Rejected — golive wave is PKG-72 start, not the full pyramid. <!-- authority: llm-explicit -->

Add more `*-route.test.mjs` source greps. Rejected — plan forbids new source-grep route tests. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: no Playwright `next start` happy-path suite. Target: named Chromium smokes pass against Compose Postgres; `smoke:docker` hits `/api/ready`; no new source-grep route tests. Deadline: before reviewing → ready_to_test. <!-- authority: llm-explicit -->

Guardrail - baseline: Production may already be live. Target: no Production deploy or merge from this task; no `sk_live_` / `PAYPAL_MODE=live`; skipped required smoke checks still fail. Deadline: ongoing. <!-- authority: llm-explicit -->

## Scope

### In scope

- Playwright Chromium only: register → verify (test hook) → login → catalog → sandbox checkout → order list. <!-- authority: llm-explicit -->
- Denial: customer cannot write vendor offers; admin can log in. <!-- authority: llm-explicit -->
- Keep Node `--test` cores; no new `*-route.test.mjs` greps. <!-- authority: llm-explicit -->
- `smoke:docker` includes `/api/ready`. <!-- authority: llm-explicit -->

### Out of scope

- Full 99×suffix matrix, Firefox/WebKit this wave, live keys, Production deploy, WordPress DNS, self-setting `done`. <!-- authority: llm-explicit -->

## Dependencies

`TASK-TEST-001` is in-flight. `TASK-UI-002`, `TASK-COM-002`, `TASK-PLT-001`, and `TASK-JOB-002` are this wave and must complete HITL before this task is eligible (`depends_on` not yet `done`). HITL remains required at reviewing → ready_to_test and testing → done. Do not request HITL while authoring. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Cursor agent authoring the local-complete golive wave queue. <!-- authority: llm-explicit -->
- Human review: Operator HITL at the two acceptance gates after implementation. <!-- authority: llm-explicit -->
