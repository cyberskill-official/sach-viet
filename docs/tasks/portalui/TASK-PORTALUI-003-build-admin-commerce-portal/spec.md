---
id: TASK-PORTALUI-003
title: "Build the admin commerce portal"
template: task@1
type: feature
module: portalui
author: "@cursor"
department: engineering
status: done
priority: p0
created_at: "2026-07-25T02:51:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-PORTALUI-001
  - TASK-REBUILD-007
  - TASK-REBUILD-008
  - TASK-REBUILD-021
source_ref:
  - operator request: full admin portal experience
  - app/web/src/app/api/admin/commerce/dashboard/route.ts
  - app/web/src/app/api/admin/vendor-applications
  - app/web/src/app/api/admin/payouts/route.ts
  - app/web/src/app/api/admin/wordpress-import
---

# Task

## Summary

Deliver an authenticated admin commerce workspace with operational KPIs, vendor-application decisions, payout visibility, and WordPress import status using existing protected admin APIs. <!-- authority: human-confirmed -->

## Problem

Admin APIs exist, but `/admin` renders the same empty table shell as every other role. Operators cannot see commerce health, review vendor applications, inspect payouts, or understand import readiness through a usable portal. <!-- authority: human-confirmed -->

## Proposed Solution

Replace the admin placeholder with a responsive dashboard and dedicated sections for overview, vendor applications, payouts, and WordPress import status. Fetch from existing admin routes, preserve server authorization and refusal semantics, require an explicit confirmation and optional reason before approve/reject mutations, and refresh affected data after successful writes. <!-- authority: llm-explicit -->

## Alternatives Considered

Expose all admin data in one generic table. Rejected because the workflows have different decisions, statuses, and recovery actions and a generic table would hide those contracts. <!-- authority: llm-explicit -->

Add new aggregate business logic in the browser. Rejected because existing cores and routes are the authoritative source for metrics, eligibility, decisions, and import state. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - an authorized admin can inspect dashboard metrics, review each vendor application, approve or reject it with clear feedback, inspect payout records, and view WordPress import state before this task reaches `done`. <!-- authority: human-confirmed -->

Guardrail - unauthorized users remain refused, double submissions are disabled, API error bodies are rendered safely, decision controls are unavailable for terminal applications, and no cutover/apply operation runs automatically. <!-- authority: llm-explicit -->

## Scope

This task owns admin commerce presentation and existing mutations; it does not change financial policy or execute production migrations. <!-- authority: human-confirmed -->

### In scope

- Commerce dashboard cards and recent operational summaries. <!-- authority: human-confirmed -->
- Vendor application list, detail context, approve/reject controls, confirmation, and refresh. <!-- authority: human-confirmed -->
- Payout list and status visibility through the existing admin payout API. <!-- authority: human-confirmed -->
- WordPress import readiness/status and historical details; apply remains a deliberate existing admin action only if the API contract supports safe previewed execution. <!-- authority: llm-explicit -->
- Loading, empty, refusal, validation, conflict, and retry states with tests. <!-- authority: llm-explicit -->

### Out of scope

- Production cutover, live WordPress parity, or automatic import application. <!-- authority: human-confirmed -->
- Unlocking publisher/author royalty or earnings financial behavior. <!-- authority: human-confirmed -->
- New payout calculations or money movement. <!-- authority: human-confirmed -->

## Dependencies

TASK-PORTALUI-001 supplies the shared design foundation. Rebuild 007, 008, and 021 supply admin commerce, vendor/payout, and WordPress import contracts. Existing role guards remain authoritative. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- **Tools used:** Cursor mapped the protected admin routes and composed UI behavior around their existing contracts. <!-- authority: llm-explicit -->
- **Scope:** No AI decision support or automated approval is introduced. <!-- authority: llm-explicit -->
- **Human review:** The operator requested the complete admin portal and retained cutover and financial-policy deferrals. <!-- authority: human-confirmed -->
