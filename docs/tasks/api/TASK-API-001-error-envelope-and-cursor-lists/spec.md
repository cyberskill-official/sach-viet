---
id: TASK-API-001
title: "Adopt error envelope and cursor lists on hot paths"
template: task@1
type: improvement
module: api
author: "@cursor"
department: engineering
status: ready_to_implement
entered_via: golive_wave
priority: p1
created_at: "2026-08-13T05:08:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-TEST-001
  - TASK-DATA-001
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-11
  - docs/plans/sachviet-full-production-completion-plan.md#FL-B2C-02
provenance:
  - "source_path: docs/plans/sachviet-full-production-completion-plan.md"
  - "source_path: /Users/stephencheng/.cursor/plans/local-complete_golive_wave_1b3ef2a9.plan.md"
  - "operator_resolution: local-complete golive wave 0 2026-08-13"
---

# Task

## Summary

New and changed hot-path handlers use `{ error: { code, message, requestId } }` and list pages use `{ items, nextCursor }`. Do not big-bang every legacy `{ error: string }` in one PR (`PKG-11` start). <!-- authority: llm-explicit -->

## Problem

`PKG-11` requires a shared error envelope and cursor lists so clients can recover deterministically (`FL-B2C-02`, `FL-PLT-02`). Current handlers still mix string errors and ad-hoc lists. The golive wave asks for an incremental contract on hot paths only, not a full rewrite of every legacy response. <!-- authority: llm-explicit -->

## Proposed Solution

Apply the envelope to new/changed handlers on hot paths: auth, catalog/search, checkout, orders, support, vendor offers, and other handlers this wave already touches. List endpoints on those paths return `{ items, nextCursor }` (null cursor means end). Include `requestId` on errors. Leave untouched legacy `{ error: string }` handlers alone unless this wave changes them. Tests import handlers and assert JSON shape; do not add source-grep route tests. <!-- authority: llm-explicit -->

Routes and authz: no new authz model; existing role guards stay. Contract applies to the hot paths named above when they are new or changed. <!-- authority: llm-explicit -->

## Alternatives Considered

Rewrite every legacy `{ error: string }` in one PR. Rejected — golive wave says incremental, not big-bang. <!-- authority: llm-explicit -->

Invent tax/shipping/royalty fields in the envelope. Rejected — DEC records unsigned; envelope is transport only. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: mixed string errors and non-cursor lists on hot paths. Target: new/changed hot-path handlers emit the named envelope and cursor page shape; `npm test` asserts them. Deadline: before reviewing → ready_to_test. <!-- authority: llm-explicit -->

Guardrail - baseline: Production may already be live. Target: no Production deploy or merge from this task; no live keys; do not break untouched legacy clients by rewriting every route. Deadline: ongoing. <!-- authority: llm-explicit -->

## Scope

### In scope

- `{ error: { code, message, requestId } }` on new/changed hot-path handlers. <!-- authority: llm-explicit -->
- `{ items, nextCursor }` on new/changed hot-path lists. <!-- authority: llm-explicit -->
- Tests: handler-imported JSON shape assertions on those paths (extend existing `tests/*-http.test.mjs`; no new `*-route.test.mjs` greps). <!-- authority: llm-explicit -->

### Out of scope

- Full PKG-11 typed client, every legacy route, finance math, live keys, WordPress DNS, self-setting `done`. <!-- authority: llm-explicit -->

## Dependencies

`TASK-TEST-001` and `TASK-DATA-001` are the in-flight audit set (HTTP suites + async pg). This task is eligible only after those complete HITL (`testing → done`). HITL remains required at reviewing → ready_to_test and testing → done. Do not request HITL while authoring. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Cursor agent authoring the local-complete golive wave queue. <!-- authority: llm-explicit -->
- Human review: Operator HITL at the two acceptance gates after implementation. <!-- authority: llm-explicit -->
