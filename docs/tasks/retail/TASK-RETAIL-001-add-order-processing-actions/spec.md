---
id: TASK-RETAIL-001
title: "Add retail order-processing actions"
template: task@1
type: feature
module: retail
author: "@codex"
department: engineering
status: on_hold
entered_via: audit
priority: p1
created_at: "2026-07-23T05:55:27Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:40-42
  - docs/04-roles-permissions.md:42
  - docs/04-roles-permissions.md:57
  - docs/07-status-roadmap.md:13
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:40-42; docs/04-roles-permissions.md:42,57; docs/07-status-roadmap.md:13; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Replace the retail portal's display-only order surface with only the existing order-processing actions recovered from the source, for `employee_b2c` and `admin` access. Do not create an order state, refund, payout, shipment, carrier, or bulk-processing feature. <!-- authority: human-confirmed -->

## Problem

The retail portal has read-only orders and the handoff calls for order-processing actions. The handoff confirms that the admin portal already has order status management, but it does not list the retail actions, transitions, validation rules, or audit behavior. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` recovers the current application behavior, make only those existing order-processing actions available to the retail role boundary confirmed by the frontend and API guard documentation. Preserve an existing audit trail if the recovered source shows one, and record any missing action, state, validation rule, or audit rule as a gap. <!-- authority: human-confirmed -->

The task must preserve `employee_b2c` and `admin` authorization and must not give the retail portal an action that cannot be traced to the recovered source. It must not alter customer access, vendor access, or other portal role behavior. <!-- authority: human-confirmed -->

## Alternatives Considered

Design a new retail order state machine. This was rejected because the handoff does not define retail status transitions or business policy. <!-- authority: llm-explicit -->

Add refunds, payouts, shipping labels, carrier integrations, or bulk processing with the order actions. This was rejected because those behaviors are absent from the retail scope in the handoff. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: retail orders are documented as read-only. Target: source-selected checks show that an authorized `employee_b2c` or `admin` user can use only a recovered existing order-processing action through the retail surface. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff does not define a retail state machine or financial, shipping, carrier, or bulk actions. Target: source-selected checks show that this task adds none of those behaviors and preserves the recovered authorization boundary. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is a role-limited retail presentation of existing recovered order processing. It does not define new commerce operations. <!-- authority: llm-explicit -->

### In scope

- Recover existing order-processing actions, their access checks, and any existing audit behavior through `TASK-DISCOVERY-001`. <!-- authority: human-confirmed -->
- Make a recovered action available only to `employee_b2c` and `admin` through the retail surface. <!-- authority: human-confirmed -->
- Record an absent action, state, validation rule, or audit rule as a gap instead of guessing. <!-- authority: human-confirmed -->

### Out of scope

- Add a new order state, refund, payout, shipping label, carrier connection, bulk action, or financial calculation. <!-- authority: human-confirmed -->
- Change customer, vendor, B2B, institution, or other role permissions. <!-- authority: human-confirmed -->
- Run the application locally, use production data, commit credentials, deploy, or perform a destructive operation without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must recover the existing order actions and their implementation evidence before this task chooses what to expose in the retail portal. <!-- authority: human-confirmed -->

Any future policy for retail transitions, refunds, shipping, carriers, or financial handling requires explicit owner direction and is outside this task. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting the handoff and approved default into this task. <!-- authority: human-confirmed -->
- Scope: The task exposes only recovered existing behavior and excludes new commerce policy. <!-- authority: llm-explicit -->
- Human review: An operator must approve any later expansion into refunds, shipping, carrier, or financial behavior. <!-- authority: human-edited -->
