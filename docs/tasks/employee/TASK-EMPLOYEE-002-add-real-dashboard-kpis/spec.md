---
id: TASK-EMPLOYEE-002
title: "Replace mocked employee dashboard KPIs with real data"
template: task@1
type: feature
module: employee
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p1
created_at: "2026-07-23T05:45:30Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:36-38
  - docs/07-status-roadmap.md:14
  - docs/07-status-roadmap.md:22-24
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:36-38; docs/07-status-roadmap.md:14,22-24; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Replace only the recovered employee-dashboard KPI cards that still use mocked data. Preserve the existing approval queue and use the recovered application source as the final authority for each card and its data contract. <!-- authority: human-confirmed -->

## Problem

The employee portal report says the approval queue is wired while dashboard KPIs are partially mocked. The roadmap separately says employee dashboards use an extended dashboard payload, so the handoff does not establish which individual cards already use live data. <!-- authority: llm-explicit -->

The application source is absent from this repository. Card definitions, routes, and data sources must be recovered before implementation. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001`, inventory the employee dashboard cards, their current data sources, and the approval queue. Connect only cards proven to be mocked to recovered source-confirmed data, and record a discrepancy when the handoff and recovered source disagree. <!-- authority: human-confirmed -->

Do not change the approval queue, role-filtered navigation, admin-only user management, or the separate employee home-config work. Do not add KPI meanings, chart designs, endpoints, or aggregation rules absent from recovered source. <!-- authority: human-confirmed -->

## Alternatives Considered

Treat every employee dashboard card as already live because the roadmap describes an extended payload. This was rejected because the portal-specific handoff identifies partially mocked KPIs. <!-- authority: llm-explicit -->

Create new KPI definitions before source recovery. This was rejected because the handoff supplies no approved measurement definitions. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the employee dashboard has partially mocked KPI cards according to the portal handoff. Target: every card included in this task is either backed by its recovered source-confirmed data contract or recorded as an evidence gap. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the approval queue is documented as wired. Target: source-selected checks show that approval-queue behavior is unchanged while KPI work is completed. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is limited to evidence-backed employee KPI cards. It excludes an employee-dashboard redesign and unrelated portal work. <!-- authority: llm-explicit -->

### In scope

- Recover the current employee dashboard cards, their source contracts, and the approval-queue boundary. <!-- authority: llm-explicit -->
- Replace only source-confirmed mock data for the employee KPI cards. <!-- authority: human-confirmed -->
- Record each unresolved card or handoff mismatch as an evidence gap. <!-- authority: human-confirmed -->

### Out of scope

- Change approval-queue workflow, navigation, user management, employee home-config, or role rules. <!-- authority: llm-explicit -->
- Invent KPI definitions, charts, aggregates, endpoints, or historical backfill. <!-- authority: llm-explicit -->
- Run the application locally, use production data, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must locate the employee dashboard, its current data sources, and approval-queue behavior before implementation begins. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting the handoff and approved default into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent dashboard cards, data contracts, KPI definitions, or new endpoint behavior. <!-- authority: llm-explicit -->
- Human review: An operator must review the recovered card inventory before implementation begins. <!-- authority: human-edited -->
