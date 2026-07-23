---
id: TASK-SUPPLIER-001
title: "Resolve and implement the supplier portal scope"
template: task@1
type: feature
module: supplier
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p2
created_at: "2026-07-23T05:53:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/04-roles-permissions.md:19-24
  - docs/04-roles-permissions.md:31-44
  - docs/04-roles-permissions.md:51-62
  - docs/07-status-roadmap.md:36
  - docs/07-status-roadmap.md:42-43
  - docs/README.md:21-25
provenance:
  - "source_path: docs/04-roles-permissions.md"
  - "source_hash: 7a14198c45c344d94c4753e3d370e2fe90a5623d455daa5eddce1c84cfa7431d"
  - "source_refs: docs/04-roles-permissions.md:19-24,31-44,51-62; docs/07-status-roadmap.md:36,42-43; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Inventory the existing supplier-role and middleware placeholders, record a default decision to defer the portal, and preserve the option to implement or retire it later. Do not create supplier access, a supplier portal, a route, a redirect change, or a role-policy change in this task. <!-- authority: human-confirmed -->

## Problem

The documentation names `employee_supplier` as a placeholder role, describes the supplier portal as not built, and calls out legacy supplier middleware and a legacy login route as known technical debt. <!-- authority: llm-explicit -->

The handoff does not define supplier users, tasks, data boundaries, access model, portal pages, business flow, migration plan, or a decision to enable the placeholder. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies the current supplier placeholders, record their source-confirmed location and behavior in a bounded decision record. The operator-approved default is to defer the supplier portal until an owner chooses to implement or retire it with a defined product scope. <!-- authority: human-confirmed -->

Keep current access and middleware behavior unchanged. If recovered source proves a live supplier user path or an urgent security issue, record the evidence for a separate reviewed task instead of extending this task into portal or authorization work. <!-- authority: human-confirmed -->

## Alternatives Considered

Build a supplier portal from the placeholder role. This was rejected because no supplier workflow, user group, or data boundary is documented. <!-- authority: llm-explicit -->

Remove the placeholder and legacy middleware immediately. This was rejected because the source does not establish whether active users, routes, or compatibility requirements still depend on them. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the supplier role and route guard are placeholders, and the supplier portal is not built. Target: a source-confirmed inventory and recorded defer, implement, or retire decision identify the current state without changing access or portal behavior. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: supplier middleware uses a legacy redirect pattern, but the source gives no active-user or route evidence. Target: source-selected checks show no new supplier account, portal page, route, role grant, redirect, or policy is created by this task. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope inventories source-confirmed supplier placeholders and records a deferred product decision. It excludes portal construction, access changes, middleware changes, and removal of compatibility behavior. <!-- authority: llm-explicit -->

### In scope

- Locate the recovered supplier role, middleware, route guard, and legacy login reference, or record an unavailable source path. <!-- authority: llm-explicit -->
- Record the default defer outcome and the conditions that would require a later implement or retire decision. <!-- authority: human-confirmed -->
- Preserve a source-confirmed inventory for owner review without exposing account data or credentials. <!-- authority: human-confirmed -->
- Record evidence of an active supplier path or security concern for a separate reviewed task if it appears during discovery. <!-- authority: human-confirmed -->

### Out of scope

- Create a supplier portal, route, account, role grant, API, data model, dashboard, or workflow. <!-- authority: human-confirmed -->
- Change supplier middleware, a legacy redirect, login behavior, role policy, or existing access. <!-- authority: human-confirmed -->
- Delete a placeholder, deploy, or take an admin-session action without separate operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the existing supplier placeholder paths and available route or access evidence, or record each unavailable, before implementation starts. <!-- authority: human-confirmed -->

Any decision to implement, retire, or alter access requires a separate owner-approved task with a source-confirmed user, workflow, data boundary, and authorization scope. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent supplier users, pages, data, routes, policies, access grants, migration steps, or a business workflow that recovered source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
