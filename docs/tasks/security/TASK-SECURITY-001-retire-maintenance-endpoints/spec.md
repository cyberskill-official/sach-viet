---
id: TASK-SECURITY-001
title: "Retire exposed maintenance debug endpoints"
template: task@1
type: improvement
module: security
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p1
created_at: "2026-07-23T04:18:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-VENDOR-001
  - TASK-VENDOR-002
source_ref:
  - docs/07-status-roadmap.md:45
  - docs/04-roles-permissions.md:61
  - docs/04-roles-permissions.md:78
  - docs/README.md:21-25
provenance:
  - "source_path: docs/07-status-roadmap.md"
  - "source_hash: 2104f7ddad7ac430bfa2629d9a2708477e8f3d9e1f4520bbde5545c894ff9fb3"
  - "source_refs: docs/07-status-roadmap.md:45; docs/04-roles-permissions.md:61,78; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

After verified vendor-dashboard completion, identify and retire only the source-confirmed exposed maintenance debug endpoints. Preserve required vendor behavior and do not treat the documented HMAC internal automation routes as the same route set without recovered source evidence. <!-- authority: human-confirmed -->

## Problem

The handoff reports that HMAC-protected maintenance debug endpoints under `/admin/maintenance/*` remain exposed and should be removed after vendor dashboard verification. The roles documentation separately describes HMAC-protected `/internal/*` routes for maintenance and automation without admin sessions. <!-- authority: llm-explicit -->

The available repository does not contain route definitions, methods, callers, HMAC implementation details, vendor-dashboard dependencies, or replacement operations needed to determine the exact exposed endpoints. Those details must come from discovery and verified prerequisites instead of assumption. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-VENDOR-001` and `TASK-VENDOR-002` are complete and discovery identifies the source route set and callers, retire exposure only for the exact maintenance endpoints established by recovered source. Add source-selected negative coverage and preservation checks for required vendor-dashboard behavior. <!-- authority: human-confirmed -->

Do not remove every HMAC internal route, infer a method or namespace, add a replacement operation, or change an access policy without evidence. If callers or required operations are unclear, record the evidence gap and request a decision before retiring an endpoint. <!-- authority: human-confirmed -->

## Alternatives Considered

Remove every HMAC-protected internal route. This was rejected because HMAC automation is documented as an existing security control and the source does not identify the full route set as exposed debug endpoints. <!-- authority: llm-explicit -->

Retire endpoints before vendor-dashboard verification. This was rejected because the handoff makes verified vendor-dashboard completion an explicit prerequisite. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the handoff records exposed HMAC maintenance debug endpoints. Target: the source-identified maintenance endpoints are no longer exposed after verified vendor-dashboard completion, while required vendor behavior remains verified. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: HMAC-keyed internal API routes are documented as an automation control, but the exact relationship to maintenance endpoints is not established. Target: the work preserves source-confirmed required internal automation behavior and does not remove a route outside the recovered maintenance set. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope retires only the source-confirmed exposed maintenance endpoint set after vendor prerequisites are complete. It excludes a general HMAC route removal, replacement operations, and new access policy work. <!-- authority: llm-explicit -->

### In scope

- Verify completion of `TASK-VENDOR-001` and `TASK-VENDOR-002` before implementation begins. <!-- authority: human-confirmed -->
- Locate the exact maintenance route set, callers, and relevant vendor-dashboard behavior from recovered source. <!-- authority: llm-explicit -->
- Retire only source-confirmed exposed maintenance endpoints and add source-selected negative and preservation checks. <!-- authority: human-confirmed -->
- Record an evidence gap and request a decision when a caller or required operation is unclear. <!-- authority: human-confirmed -->

### Out of scope

- Remove every HMAC-protected internal route, add a replacement endpoint, or change the HMAC access policy without source evidence. <!-- authority: llm-explicit -->
- Change vendor-dashboard behavior or start vendor dashboard analytics work. <!-- authority: llm-explicit -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-VENDOR-001` and `TASK-VENDOR-002` must both be complete before implementation begins. `TASK-VENDOR-002` remains subject to its own owner-approved KPI decision, so this task cannot begin until that decision-backed work and vendor verification are complete. <!-- authority: human-confirmed -->

Discovery must identify the source route set and callers, or record them unavailable, before any endpoint retirement decision. This is a source-evidence requirement rather than a dependency on an unnamed team. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent route methods, namespaces, callers, HMAC implementation details, replacement operations, or access policies that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
