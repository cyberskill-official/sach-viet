---
id: TASK-EMPLOYEE-001
title: "Connect the employee home-config editor to its backend"
template: task@1
type: feature
module: employee
author: "@codex"
department: engineering
status: testing
entered_via: audit
priority: p0
created_at: "2026-07-23T04:03:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:36-38
  - docs/07-status-roadmap.md:22-23
  - docs/07-status-roadmap.md:57
  - docs/02-architecture.md:42
  - docs/02-architecture.md:48
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:36-38; docs/07-status-roadmap.md:22-23,57; docs/02-architecture.md:42,48; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Connect the existing employee home-config edit UI to a source-confirmed backend contract after discovery identifies the relevant UI, API, model, and authorization paths. Preserve the existing employee portal behavior and do not create a new configuration product. <!-- authority: human-confirmed -->

## Problem

The employee portal has sub-role-filtered navigation and an approval queue already wired from the `/dashboard` payload, but its home-config edit UI is documented as not wired to a backend. <!-- authority: llm-explicit -->

The available repository does not contain the application source needed to establish the current component, composable, API endpoint, model, validation, or authorization contract. Those details must come from discovery instead of assumption. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies the application source and current behavior, trace the home-config editor, its data access path, and the relevant authorization boundary. Connect the UI only to an existing source-confirmed backend contract and add source-selected verification of its read and persistence behavior. <!-- authority: human-confirmed -->

If discovery finds no backend contract, record the evidence gap and request a product or design decision before creating a model, endpoint, payload, or policy. Do not infer one from the presence of the UI. <!-- authority: human-confirmed -->

## Alternatives Considered

Build a new home-config API and model immediately. This was rejected because the handoff establishes a disconnected UI but does not define a backend contract. <!-- authority: llm-explicit -->

Defer the disconnected editor. This was rejected because the handoff identifies it as a small first-work item that touches both application halves. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the handoff states that the employee home-config edit UI exists but is not wired to a backend. Target: the recovered source confirms that the editor reads and persists its existing configuration through the established backend contract, with source-selected verification, or records a bounded evidence gap when no contract exists. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: employee navigation and the approval queue are documented as current behavior. Target: source-selected checks preserve the relevant sub-role filtering and approval-queue behavior while the editor is connected. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope connects one existing editor to source-confirmed behavior and keeps new configuration design, role-policy changes, and employee dashboard KPI work outside this task. <!-- authority: llm-explicit -->

### In scope

- Locate the home-config editor, its data access path, and the relevant authorization boundary from the discovery output. <!-- authority: llm-explicit -->
- Connect the UI to an existing source-confirmed backend contract and verify source-confirmed read and persistence behavior. <!-- authority: human-confirmed -->
- Record a bounded evidence gap and request a decision if no backend contract exists. <!-- authority: human-confirmed -->
- Run only source-selected static checks or approved preview verification. <!-- authority: human-edited -->

### Out of scope

- Create a new home-config schema, endpoint, payload contract, or role policy. <!-- authority: llm-explicit -->
- Change employee dashboard KPIs, approval-queue behavior, or sub-role navigation. <!-- authority: llm-explicit -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the application path, current editor implementation, and backend contract, or record each unavailable, before implementation starts. This is a discovery result rather than a dependency on an unnamed team. <!-- authority: human-confirmed -->

The handoff constraints against local application execution, public repositories, and committed secrets remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a home-config model, endpoint, payload, role policy, or test path that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
