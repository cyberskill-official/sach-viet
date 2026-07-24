---
id: TASK-REBUILD-007
title: "Build admin commerce operations"
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
  - TASK-REBUILD-004
  - TASK-REBUILD-005
source_ref:
  - docs/03-portals.md:32-34
  - docs/04-roles-permissions.md:14-29
  - docs/05-data-model.md:30-36
  - docs/07-status-roadmap.md:5-18
provenance:
  - "source_path: docs/03-portals.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
---

# Task

## Summary

Build the greenfield admin commerce foundation: a signed-session admin dashboard with order and revenue summaries, plus a vendor application queue that administrators can approve or reject with a reason. <!-- authority: human-confirmed -->

## Problem

The new application has catalog offers and paid-order records but no administrator view of commerce state or vendor onboarding. The source identifies an admin dashboard, order visibility, vendor approve or reject behavior, payouts, and sensitive-mutation audit history. <!-- authority: llm-explicit -->

## Proposed Solution

Add a SQLite admin-commerce repository and admin-only route handlers. The repository will aggregate existing paid-order values as USD dashboard revenue, list recent orders without exposing customer secrets, persist vendor applications, and atomically approve or reject an application. Approval assigns the applicant the existing `vendor` role; rejection requires a reason. Emit safe structured events for approval and rejection. <!-- authority: human-confirmed -->

## Alternatives Considered

Add payout calculation, transfer scheduling, or a financial ledger. This is deferred because the source defines payout records but does not define settlement eligibility, cadence, amount rules, or payment authority. <!-- authority: human-confirmed -->

Add new order fulfillment statuses. This is deferred because the source identifies order-status management but does not define the allowed greenfield fulfillment-state transitions. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the greenfield application has no admin commerce queue. Target: tests prove an administrator can obtain dashboard totals and approve or reject a pending vendor application while a non-administrator cannot. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: only paid USD orders have established commerce totals, and the source does not define payout or fulfillment policy. Target: tests prove dashboard revenue counts only paid orders and the implementation creates no payout, transfer, or fulfillment transition. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

This task establishes an admin-only commerce read surface and vendor onboarding decision record. It does not add payout settlement, vendor analytics, reporting exports, fulfillment actions, inventory reconciliation, refunds, promotions, legacy import, or deployment. <!-- authority: llm-explicit -->

### In scope

- Admin-only order and paid-revenue dashboard reads based on the existing commerce records. <!-- authority: human-confirmed -->
- Vendor applications with pending, approved, and rejected states, plus a required rejection reason. <!-- authority: human-confirmed -->
- Role assignment to the existing `vendor` role only after administrator approval. <!-- authority: human-confirmed -->
- Safe structured events that exclude session tokens, email addresses, and request-body content. <!-- authority: llm-explicit -->

### Out of scope

- Payout amount calculation, settlement, money transfer, ledger, tax, invoice, or accounting behavior. <!-- authority: human-confirmed -->
- Order fulfillment states, shipment tracking, returns, refunds, or customer service actions. <!-- authority: llm-explicit -->
- Legacy WordPress, Laravel, Nuxt, or recovered application code. <!-- authority: human-confirmed -->

## Dependencies

Task 2 provides signed sessions, role normalization, and the existing user-role record. Task 4 provides vendor offers and vendor identity context. Task 5 provides the orders and paid USD subtotal used by the dashboard. Task 8 can add seller-facing payout history after a settlement policy is defined. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented admin role and marketplace records into the greenfield Next.js scope. <!-- authority: human-confirmed -->
- Scope: The task excludes undefined settlement and fulfillment policy. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue and routine acceptance gates for this session. <!-- authority: human-confirmed -->
