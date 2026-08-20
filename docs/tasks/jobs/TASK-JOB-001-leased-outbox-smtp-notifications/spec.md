---
id: TASK-JOB-001
title: "Leased outbox, real email submitter, and durable notifications"
template: task@1
type: improvement
module: jobs
author: "@cursor"
department: engineering
status: done
entered_via: audit
priority: p0
created_at: "2026-08-12T20:00:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-REBUILD-023
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/07-status-roadmap.md
provenance:
  - "source_path: /opt/cursor/artifacts/plans/implement_all_findings_13d6d768.plan.md"
  - "operator_resolution: implement follow plan 2026-08-12"
---

# Task

## Summary

Outbox claims use FOR UPDATE SKIP LOCKED plus lease columns. Vercel cron GET /api/cron/drain-order-comms with CRON_SECRET. SMTP/Resend submitters mark delivered only after a real send. SSE polls a DB cursor. <!-- authority: llm-explicit -->

## Problem

The 2026-08-13 audit recorded this gap against the live greenfield app. Existing REBUILD tasks stay done; this slice supersedes the matching on_hold row where noted. <!-- authority: llm-explicit -->

## Proposed Solution

Implement the slice in `app/web` with Postgres transactions, HTTP handlers that return JSON error envelopes, and tests that import handlers or cores instead of grepping route source. <!-- authority: llm-explicit -->

Routes and authz: GET /api/cron/drain-order-comms; GET /api/notifications/stream. <!-- authority: llm-explicit -->

## Alternatives Considered

Reopen TASK-REBUILD-001…023. Rejected — those tasks are done; new IDs carry the audit work. <!-- authority: llm-explicit -->

Invent royalty, tax, shipping, live payment keys, Zalo OA, or WordPress DNS. Rejected — those wait on named DEC records. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the audit finding is open. Target: the routes and tests named below are implemented and `npm test` covers them. Deadline: before reviewing → ready_to_test. <!-- authority: llm-explicit -->

Guardrail - baseline: Production may already be live. Target: no Production deploy, merge, or `seed:local` against Production from this task; no `sk_live_` / `PAYPAL_MODE=live`. Deadline: ongoing. <!-- authority: llm-explicit -->

## Scope

### In scope

- Outbox claims use FOR UPDATE SKIP LOCKED plus lease columns. Vercel cron GET /api/cron/drain-order-comms with CRON_SECRET. SMTP/Resend submitters mark delivered only after a real send. SSE polls a DB cursor. <!-- authority: llm-explicit -->
- Tests: tests/order-comms-outbox-core.test.mjs, tests/live-notifications-core.test.mjs. <!-- authority: llm-explicit -->

### Out of scope

- WordPress DNS, live Stripe/PayPal, invented finance numbers, self-setting `done`. <!-- authority: llm-explicit -->

## Dependencies

`TASK-REBUILD-023` (done). HITL remains required at reviewing → ready_to_test and testing → done. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Cursor cloud agent implementing the approved audit plan. <!-- authority: llm-explicit -->
- Human review: Operator HITL at the two acceptance gates. <!-- authority: llm-explicit -->
