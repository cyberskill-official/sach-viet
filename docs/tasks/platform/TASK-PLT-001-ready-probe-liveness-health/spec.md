---
id: TASK-PLT-001
title: "Add GET /api/ready; keep /api/health liveness-only"
template: task@1
type: feature
module: platform
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
  - TASK-DATA-001
  - TASK-JOB-001
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-full-production-completion-plan.md#FL-PLT-01
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-03
provenance:
  - "source_path: docs/plans/sachviet-full-production-completion-plan.md"
  - "source_path: /Users/stephencheng/.cursor/plans/local-complete_golive_wave_1b3ef2a9.plan.md"
  - "operator_resolution: local-complete golive wave 0 2026-08-13"
---

# Task

## Summary

Add `GET /api/ready` that pings the database, reports latest migration id, outbox oldest-age, and required env *presence* without secret values. `GET /api/health` stays process/liveness only (`FL-PLT-01`). Extend local `smoke:docker` to hit `/api/ready`. <!-- authority: llm-explicit -->

## Problem

The local-complete golive wave and `FL-PLT-01` require a readiness probe distinct from liveness. `app/web/src/app/api/health/route.ts` exists; `/api/ready` does not. Load balancers that treat health as ready can route traffic before Postgres, migrations, or outbox config are usable. <!-- authority: llm-explicit -->

## Proposed Solution

Add `app/web/src/app/api/ready/route.ts`. Readiness checks: DB ping, latest migration id, outbox oldest-age, required env presence (names only; never values). Do not expose error internals or secrets. Health remains process-only. Tests import the ready handler; do not add source-grep route tests. US-region move, PITR drill, and staging Vercel stay in DEC-OPS-001 / PKG-03 and are out of this task. <!-- authority: llm-explicit -->

Routes and authz: `GET /api/health` (unchanged liveness); `GET /api/ready` (readiness; unauthenticated probe, no secrets). <!-- authority: llm-explicit -->

## Alternatives Considered

Fold readiness into `/api/health`. Rejected — `FL-PLT-01` requires liveness to check the process only. <!-- authority: llm-explicit -->

Implement US-region Supabase, PITR, or a staging Vercel project in this task. Rejected — DEC-OPS-001 / PKG-03, not this wave. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: only `/api/health` exists. Target: `/api/ready` returns readiness JSON without secrets; health stays liveness; `smoke:docker` hits ready; `npm test` covers the named tests. Deadline: before reviewing → ready_to_test. <!-- authority: llm-explicit -->

Guardrail - baseline: Production may already be live. Target: no Production deploy, merge, or secret values in probe bodies; no `sk_live_` / `PAYPAL_MODE=live`. Deadline: ongoing. <!-- authority: llm-explicit -->

## Scope

### In scope

- `GET /api/ready`: DB ping, latest migration id, outbox oldest-age, required env presence. <!-- authority: llm-explicit -->
- `GET /api/health` stays process/liveness. <!-- authority: llm-explicit -->
- Local `smoke:docker` hits `/api/ready`. <!-- authority: llm-explicit -->
- Tests: handler-imported ready/health assertions (for example `tests/ready-http.test.mjs`); no `*-route.test.mjs` source greps. <!-- authority: llm-explicit -->

### Out of scope

- US-region cutover, PITR drill, staging Vercel project (DEC-OPS-001), live keys, WordPress DNS, self-setting `done`. <!-- authority: llm-explicit -->

## Dependencies

`TASK-DATA-001` and `TASK-JOB-001` are the in-flight audit set (async pg + leased outbox age). This task is eligible only after those complete HITL (`testing → done`). HITL remains required at reviewing → ready_to_test and testing → done. Do not request HITL while authoring. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Cursor agent authoring the local-complete golive wave queue. <!-- authority: llm-explicit -->
- Human review: Operator HITL at the two acceptance gates after implementation. <!-- authority: llm-explicit -->
