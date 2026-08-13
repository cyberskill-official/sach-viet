---
id: TASK-OPS-001
title: "Retire WP-import apply, admin AI, and supplier portal from Production UI"
template: task@1
type: improvement
module: ops
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
  - TASK-GOV-001
  - TASK-SEC-002
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-10
  - docs/plans/sachviet-full-production-completion-plan.md#FL-PLT-09
  - docs/plans/sachviet-full-production-completion-plan.md#FL-ADM-11
provenance:
  - "source_path: docs/plans/sachviet-full-production-completion-plan.md"
  - "source_path: /Users/stephencheng/.cursor/plans/local-complete_golive_wave_1b3ef2a9.plan.md"
  - "operator_resolution: local-complete golive wave 0 2026-08-13"
---

# Task

## Summary

After a short dependency check, Production-retire WordPress import apply, admin AI settings/chat, and the supplier portal from UI and reachable routes (`PKG-10` slice). Keep WordPress fixture import for tests if REBUILD-021 still needs it. Do not delete migrations 001–003. <!-- authority: llm-explicit -->

## Problem

`GAP-OPS-001` / `PKG-10` / `FL-PLT-09` / `FL-ADM-11` still leave WordPress apply, admin AI, and supplier reservation reachable or advertised. TASK-SEC-002 already 410s Production AI chat unless `AI_CHAT_ENABLED=1`; TASK-GOV-001 gates apply behind the commerce kill-switch. The golive wave wants those surfaces retired from Production UI, not merely flagged. <!-- authority: llm-explicit -->

## Proposed Solution

Run a short dependency check (admin dashboard links, seed, verify scripts). Then gate or return 410 on Production for `POST /api/admin/wordpress-import/apply`, `/api/admin/ai-settings`, `/api/admin/ai/chat`. Hide supplier portal / `employee_supplier` from nav; matcher returns 404/410. Stop advertising CapRover/SQLite as a path in `app/web/OPERATIONS.md`. Keep WordPress **fixture** import in tests only if still required for the REBUILD-021 verifier. Do not delete 001–003 migrations. Do not execute WordPress DNS cutover (`TASK-CUTOVER-*` stay on_hold). <!-- authority: llm-explicit -->

Routes and authz: Production 410/hidden for WP apply, admin AI settings/chat, supplier portal; local/test fixture import may remain. <!-- authority: llm-explicit -->

## Alternatives Considered

Delete import migrations and REBUILD-021 fixtures. Rejected — plan says keep 001–003 and test fixtures if the verifier still needs them. <!-- authority: llm-explicit -->

Reopen TASK-SUPPLIER-001 or TASK-CUTOVER-002. Rejected — supplier has no replacement portal this wave; DNS cutover stays on_hold. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: WP apply, admin AI, and supplier remain reachable or linked in Production UI. Target: Production UI and those APIs are 410/hidden after the dependency check; tests cover the denials; `npm test` passes. Deadline: before reviewing → ready_to_test. <!-- authority: llm-explicit -->

Guardrail - baseline: Production may already be live. Target: no Production deploy, merge, or DNS change from this task; no deletion of migrations 001–003. Deadline: ongoing. <!-- authority: llm-explicit -->

## Scope

### In scope

- Dependency check of admin dashboard links, seed, and verify scripts. <!-- authority: llm-explicit -->
- Production gate or 410: `/api/admin/wordpress-import/apply`, `/api/admin/ai-settings`, `/api/admin/ai/chat`. <!-- authority: llm-explicit -->
- Hide supplier portal / `employee_supplier` from nav; matcher 404/410. <!-- authority: llm-explicit -->
- OPERATIONS.md must not advertise CapRover/SQLite as a supported path. <!-- authority: llm-explicit -->
- Tests: handler status codes for retired Production routes (extend existing HTTP/core tests; no new source-grep `*-route.test.mjs`). <!-- authority: llm-explicit -->

### Out of scope

- WordPress DNS / `TASK-CUTOVER-*`, deleting 001–003 migrations, live payment keys, invented finance numbers, self-setting `done`. <!-- authority: llm-explicit -->

## Dependencies

`TASK-GOV-001` and `TASK-SEC-002` are the in-flight audit set (kill-switch + AI allowlist). This task is eligible only after those complete HITL (`testing → done`). HITL remains required at reviewing → ready_to_test and testing → done. Do not request HITL while authoring. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Cursor agent authoring the local-complete golive wave queue. <!-- authority: llm-explicit -->
- Human review: Operator HITL at the two acceptance gates after implementation. <!-- authority: llm-explicit -->
