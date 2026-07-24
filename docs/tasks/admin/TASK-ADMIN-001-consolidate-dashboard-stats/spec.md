---
id: TASK-ADMIN-001
title: "Consolidate duplicate dashboard statistics endpoints"
template: task@1
type: improvement
module: admin
author: "@codex"
department: engineering
status: on_hold
entered_via: audit
priority: p2
created_at: "2026-07-23T04:13:45Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:32-34
  - docs/07-status-roadmap.md:44
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:32-34; docs/07-status-roadmap.md:44; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Consolidate only source-confirmed duplicate admin dashboard statistics paths after discovery identifies the endpoints and their callers. Preserve the documented dashboard behavior throughout the change. <!-- authority: human-confirmed -->

## Problem

The admin portal has real dashboard statistics, revenue, and recent orders. The handoff separately lists duplicate dashboard statistics endpoints as inherited technical debt that should be verified before fixing. <!-- authority: llm-explicit -->

The available repository does not contain endpoint names, callers, response payloads, authorization rules, metric definitions, or checks needed to determine which paths are duplicates. Those details must come from discovery instead of assumption. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies the dashboard statistics paths and callers, trace source-confirmed duplication and consolidate only paths with compatible observed contracts. Add source-selected checks that preserve documented dashboard statistics, revenue, and recent-order behavior. <!-- authority: human-confirmed -->

If recovered callers have incompatible contracts or a source-visible behavior choice is required, record the evidence gap and request a decision before removing or changing an endpoint. Do not infer an endpoint name, payload, threshold, or migration plan. <!-- authority: human-confirmed -->

## Alternatives Considered

Delete one endpoint before tracing callers. This was rejected because the handoff instructs the team to verify inherited technical debt before fixing it. <!-- authority: llm-explicit -->

Rewrite the dashboard data layer. This was rejected because the source identifies a duplicate-path cleanup while the current dashboard behavior is documented as real. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the handoff records duplicate dashboard statistics endpoints while application source is unavailable in this repository. Target: source-confirmed duplicate statistics paths are consolidated and documented dashboard behavior remains verified by source-selected checks. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the admin dashboard currently exposes real statistics, revenue, and recent orders. Target: the cleanup does not change source-confirmed metric meaning, authorization, caller behavior, or dashboard output. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope consolidates source-confirmed duplicate statistics paths and preserves current dashboard behavior. It excludes dashboard redesign, metric changes, and unverified endpoint removal. <!-- authority: llm-explicit -->

### In scope

- Locate dashboard statistics endpoints, callers, response contracts, and authorization boundaries from the discovery output. <!-- authority: llm-explicit -->
- Identify source-confirmed duplicate paths with compatible observed contracts. <!-- authority: human-confirmed -->
- Consolidate only those duplicate paths and add source-selected preservation checks. <!-- authority: human-confirmed -->
- Record an evidence gap and request a decision when callers have incompatible contracts or behavior is ambiguous. <!-- authority: human-confirmed -->

### Out of scope

- Redesign the dashboard, change metric meanings, alter roles or authorization, or add new dashboard features. <!-- authority: llm-explicit -->
- Remove or rename an endpoint before its callers and behavior are source-confirmed. <!-- authority: llm-explicit -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the application path, current dashboard statistics paths, callers, and observed contracts, or record each unavailable, before implementation starts. This is a discovery result rather than a dependency on an unnamed team. <!-- authority: human-confirmed -->

The handoff constraints against local application execution, public repositories, and committed secrets remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent endpoint names, caller paths, payloads, thresholds, authorization rules, metric definitions, or test paths that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
