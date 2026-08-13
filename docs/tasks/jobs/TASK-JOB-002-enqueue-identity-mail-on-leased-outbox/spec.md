---
id: TASK-JOB-002
title: "Enqueue register, verify, and reset mail on the leased outbox"
template: task@1
type: feature
module: jobs
author: "@cursor"
department: engineering
status: ready_to_implement
entered_via: golive_wave
priority: p0
created_at: "2026-08-13T05:08:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-JOB-001
  - TASK-ID-001
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-full-production-completion-plan.md#FL-ID-01
  - docs/plans/sachviet-full-production-completion-plan.md#FL-ID-06
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-09
provenance:
  - "source_path: docs/plans/sachviet-full-production-completion-plan.md"
  - "source_path: /Users/stephencheng/.cursor/plans/local-complete_golive_wave_1b3ef2a9.plan.md"
  - "operator_resolution: local-complete golive wave 0 2026-08-13"
---

# Task

## Summary

Register, verify, and password-reset must enqueue identity mail on the leased outbox (`identity.verify` / `identity.reset`) instead of succeeding with no durable send. Production without SMTP stays `failed`, not `delivered`. Tests inject `submit`. <!-- authority: llm-explicit -->

## Problem

The local-complete golive wave records that register/verify/reset currently succeed without writing the outbox. TASK-JOB-001 ships the leased worker and real submitter; TASK-ID-001 ships the identity routes. Until they are hooked together, verification and reset mail never leave the worker path (`FL-ID-01`, `FL-ID-06`, `FL-PLT-05` transactional slice). <!-- authority: llm-explicit -->

## Proposed Solution

Hook `app/web/src/lib/auth-core.mjs` to `app/web/src/lib/order-comms-outbox-core.mjs` (or a shared `jobs` table using the same lease) with kinds `identity.verify` and `identity.reset`. Drain remains `GET /api/cron/drain-order-comms` with `CRON_SECRET`. Mark `delivered` only after a real submitter send. Without SMTP/Resend config, rows stay `failed`, not `delivered`. Tests inject `submit`. Do not invent sender domain, SPF/DKIM, or Zalo OA policy (DEC-COMMS-001). <!-- authority: llm-explicit -->

Routes and authz: existing `POST /api/auth/register`, `GET|POST /api/auth/verify`, `POST /api/auth/forgot`, `POST /api/auth/reset`; cron drain unchanged. <!-- authority: llm-explicit -->

## Alternatives Considered

Send identity mail inline from the HTTP handler. Rejected — TASK-JOB-001 already requires leased outbox + real submitter. <!-- authority: llm-explicit -->

Activate Zalo OA or invent a production sender domain. Rejected — DEC-COMMS-001. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: identity routes succeed with no outbox row. Target: register/verify/reset enqueue the named kinds; missing SMTP → `failed` not `delivered`; `npm test` covers injected `submit`. Deadline: before reviewing → ready_to_test. <!-- authority: llm-explicit -->

Guardrail - baseline: Production may already be live. Target: no Production deploy or merge from this task; no secret values in logs; no `sk_live_` / `PAYPAL_MODE=live`. Deadline: ongoing. <!-- authority: llm-explicit -->

## Scope

### In scope

- Enqueue `identity.verify` / `identity.reset` from auth-core onto the leased outbox. <!-- authority: llm-explicit -->
- Production without SMTP stays `failed`, not `delivered`. <!-- authority: llm-explicit -->
- Tests inject `submit`: extend `tests/auth-core.test.mjs` / `tests/auth-http.test.mjs` and `tests/order-comms-outbox-core.test.mjs` (handler/core, not greps). <!-- authority: llm-explicit -->

### Out of scope

- Signed email provider/domain/Zalo OA (DEC-COMMS-001), marketing consent, live payment keys, WordPress DNS, self-setting `done`. <!-- authority: llm-explicit -->

## Dependencies

`TASK-JOB-001` and `TASK-ID-001` are the in-flight audit set. This task is eligible only after those complete HITL (`testing → done`). HITL remains required at reviewing → ready_to_test and testing → done. Do not request HITL while authoring. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Cursor agent authoring the local-complete golive wave queue. <!-- authority: llm-explicit -->
- Human review: Operator HITL at the two acceptance gates after implementation. <!-- authority: llm-explicit -->
