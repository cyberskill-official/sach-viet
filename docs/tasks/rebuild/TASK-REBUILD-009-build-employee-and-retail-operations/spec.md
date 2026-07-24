---
id: TASK-REBUILD-009
title: "Build employee and retail operations"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
priority: p0
created_at: "2026-07-24T00:00:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-002
  - TASK-REBUILD-003
  - TASK-REBUILD-005
source_ref:
  - docs/03-portals.md:36-42
  - docs/04-roles-permissions.md:7-64
  - docs/05-data-model.md:17-29
  - docs/07-status-roadmap.md:20-28
provenance:
  - "source_path: docs/03-portals.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
---

# Task

## Summary

Build the greenfield employee and retail operations foundation: a signed-session employee dashboard with counts derived from existing commerce and support records, an employee-editable home-config store for homepage sections, and retail order-queue reads for `employee_b2c` and `admin`. <!-- authority: human-confirmed -->

## Problem

The greenfield application already has identity, portal shells, paid orders, and support queues, but internal staff still lack an employee hub summary, a persisted home-config surface, and a retail order queue. The source identifies the `/employee` hub with role-filtered access, an approval queue from the dashboard payload, partially mocked employee KPIs, an unwired home-config editor, and a `/retail` portal whose orders are display-only for B2C ops staff. <!-- authority: llm-explicit -->

## Proposed Solution

Add a SQLite employee-retail operations repository and signed-session route handlers in `app/web`. Employee-portal roles (`employee`, `employee_b2c`, `employee_b2b`, and `admin`) may read a dashboard summary derived from existing order, support-ticket, goods-request, and pending vendor-application counts, plus a pending vendor-application approval queue without customer secrets. Employee and admin actors may read and update homepage `home_sections` configuration records. Retail-portal roles (`employee_b2c` and `admin`) may list commerce orders without customer email, session tokens, or payment secrets. Emit safe structured events for home-config writes. <!-- authority: human-confirmed -->

## Alternatives Considered

Invent retail order fulfillment transitions, shipment tracking, refunds, or returns workflow. This is rejected because the source identifies those needs but does not define the greenfield fulfillment-state or returns contract, and earlier rebuild tasks already deferred those transitions. <!-- authority: human-confirmed -->

Build a B2B quote pipeline or institution buyer flows inside this task. This is deferred because the approved rebuild sequence reserves those surfaces for later B2B and institution tasks. <!-- authority: llm-explicit -->

Invent new KPI chart series, report exports, or user-management CRUD beyond the existing role record. This is deferred because the source asks for real baseline dashboard facts and a wired home-config editor, not a new analytics or HR product. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the greenfield application has no employee dashboard summary, home-config persistence, or retail staff order queue. Target: tests prove an authorized employee can read dashboard totals and the pending approval queue, an employee or administrator can persist home sections, an `employee_b2c` or `admin` actor can list retail orders, and unauthorized roles cannot. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: order payment states are already limited to pending, paid, and payment_failed, and customer secrets must stay out of staff list views. Target: tests prove the implementation creates no fulfillment, refund, returns, or settlement transitions and omits customer email, session tokens, and payment secrets from employee and retail responses and events. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

This task establishes employee dashboard reads, home-config persistence, and retail order-queue reads under the documented role boundaries. It does not invent fulfillment policy, returns, refunds, B2B quotes, live notifications, or deployment. <!-- authority: llm-explicit -->

### In scope

- Employee dashboard summary counts derived from existing orders, open support tickets, open goods requests, and pending vendor applications. <!-- authority: human-confirmed -->
- Pending vendor-application approval-queue reads for employee-portal roles, without resolving applications outside the existing admin decision path. <!-- authority: llm-explicit -->
- Home-config `home_sections` persistence with create/update/list for employee and administrator actors. <!-- authority: human-confirmed -->
- Retail order-queue reads for `employee_b2c` and `admin`, excluding customer secrets. <!-- authority: human-confirmed -->
- Safe structured events that exclude session tokens, email addresses, request bodies, and payment secrets. <!-- authority: llm-explicit -->

### Out of scope

- Order fulfillment states, shipment tracking, refunds, returns workflow, carrier labels, or bulk processing. <!-- authority: human-confirmed -->
- B2B quote pipeline, institution budget/PO flows, publisher/author earnings, or supplier portal work. <!-- authority: llm-explicit -->
- New user-management CRUD, chart-series analytics, report export, legacy WordPress/Laravel/Nuxt recovery, or deployment. <!-- authority: human-confirmed -->

## Dependencies

Task 2 provides signed sessions and role normalization, including employee and retail portal role bundles. Task 3 provides shared portal foundations. Task 5 provides orders used by the employee summary and retail queue. Existing support and admin-commerce tables supply ticket, goods-request, and vendor-application counts when present. Later retail returns or B2B tasks may extend this foundation after policy is defined. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented employee and retail portal gaps and greenfield rebuild sequence into this task. <!-- authority: human-confirmed -->
- Scope: The task excludes undefined fulfillment, returns, refund, and B2B quote behavior. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue and session-wide routine acceptance gates. <!-- authority: human-confirmed -->
