---
id: TASK-RETAIL-002
title: "Add the returns workflow"
template: task@1
type: feature
module: retail
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p1
created_at: "2026-07-23T05:57:20Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-RETAIL-001
source_ref:
  - docs/03-portals.md:40-42
  - docs/04-roles-permissions.md:42
  - docs/04-roles-permissions.md:57
  - docs/05-data-model.md:20-23
  - docs/07-status-roadmap.md:27
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:40-42; docs/04-roles-permissions.md:42,57; docs/05-data-model.md:20-23; docs/07-status-roadmap.md:27; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Add a staff-operated, non-financial manual return case linked to a recovered existing order or order item for `employee_b2c` and `admin`. Do not calculate or issue refunds, decide eligibility automatically, create shipping labels, or expose a customer self-service return flow. <!-- authority: human-confirmed -->

## Problem

The retail portal has returns pages, but the handoff says the returns workflow has no backend. The commerce model confirms orders and order items, yet it does not define a returns entity, states, refund rules, eligibility rules, shipping behavior, or customer-service policy. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-RETAIL-001` recovers the retail order context, implement only a manual staff return case tied to a source-confirmed existing order or order item and restricted to `employee_b2c` and `admin`. The case may capture only recovered non-financial information, and any unsupported field, state, storage path, or permission must be recorded as a gap. <!-- authority: human-confirmed -->

If the recovered application has no supported private storage path for the manual case, record the data-model gap and stop before inventing a new schema. A human must separately approve any refund, eligibility, shipping, carrier, or customer-service policy. <!-- authority: human-confirmed -->

## Alternatives Considered

Build a complete automated return, refund, and shipping workflow. This was rejected because the handoff explicitly identifies no returns backend and does not define the governing policy. <!-- authority: llm-explicit -->

Expose returns to customers directly. This was rejected because the documented retail scope is an internal `employee_b2c` portal and no customer return journey is specified. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the returns page exists but no backend workflow is documented. Target: source-selected checks show that an authorized staff user can create or update only a recovered, non-financial manual return case linked to an existing order or item, or that the missing storage path is recorded as a gap. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff defines no refund, eligibility, shipping, carrier, or customer-service policy. Target: source-selected checks show that the return case does not perform any of those actions and remains limited to `employee_b2c` and `admin`. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is a manual staff record for a possible return, limited by the recovered application evidence. It is not a monetary or customer-facing returns program. <!-- authority: llm-explicit -->

### In scope

- Use the recovered retail order context from `TASK-RETAIL-001` and existing order or item relationships where source-confirmed. <!-- authority: human-confirmed -->
- Allow only `employee_b2c` and `admin` to perform recovered manual, non-financial return-case actions. <!-- authority: human-confirmed -->
- Record missing storage, fields, states, or permissions as a gap instead of creating a new data model. <!-- authority: human-confirmed -->

### Out of scope

- Add automatic eligibility, refunds, payment changes, credits, shipping labels, carrier connections, returns logistics, or customer self-service. <!-- authority: human-confirmed -->
- Invent a return state machine, financial policy, customer-service policy, or data schema. <!-- authority: human-confirmed -->
- Run the application locally, use production data, commit credentials, deploy, or perform a destructive operation without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-RETAIL-001` must establish the recovered retail order actions and role boundary before this task adds a manual return case. <!-- authority: human-confirmed -->

Refunds, eligibility, shipping, carrier operations, and customer-service behavior remain explicit owner decisions outside this task. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting the handoff and approved default into this task. <!-- authority: human-confirmed -->
- Scope: The task provides only a recovered, staff-operated, non-financial manual case or records the missing storage gap. <!-- authority: llm-explicit -->
- Human review: An operator must approve any later refund, shipping, carrier, eligibility, or customer-service scope. <!-- authority: human-edited -->
