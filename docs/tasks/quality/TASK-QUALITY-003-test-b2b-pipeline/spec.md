---
id: TASK-QUALITY-003
title: "Add B2B quote-pipeline regression coverage"
template: task@1
type: improvement
module: quality
author: "@codex"
department: engineering
status: testing
entered_via: audit
priority: p0
created_at: "2026-07-23T03:56:23Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/05-data-model.md:38-45
  - docs/03-portals.md:44-46
  - docs/06-tech-stack.md:47
  - docs/07-status-roadmap.md:14
  - docs/07-status-roadmap.md:31
  - docs/07-status-roadmap.md:47
  - docs/README.md:21-23
provenance:
  - "source_path: docs/05-data-model.md"
  - "source_hash: 6c59dd10d4d5e9ba1fe5ae8313f51428b1f6bd8d7b6176b49dc223e5192c8b1c"
  - "source_refs: docs/05-data-model.md:38-45; docs/03-portals.md:44-46; docs/06-tech-stack.md:47; docs/07-status-roadmap.md:14,31,47; docs/README.md:21-23"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Add regression coverage for the documented B2B quote lifecycle and current pipeline behavior after discovery identifies the actual application and test paths. The work uses synthetic non-production data and does not implement quote-to-order conversion or navigation changes. <!-- authority: human-confirmed -->

## Problem

The handoff documents a quote lifecycle with draft, sent, negotiating, won, and lost states. It also says the B2B staff portal has real pipeline data and quote management, while the testing bar remains thin. <!-- authority: llm-explicit -->

The available repository does not contain the application source, routes, test files, or current behavior needed to name test paths or create an exact behavioral contract. Those details must come from discovery instead of assumption. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies the application source and test setup, map the quote pipeline implementation and select the test layer from the recovered source. Add regression coverage for every documented lifecycle state and transition plus relevant current pipeline and quote-management behavior. <!-- authority: human-confirmed -->

Use synthetic non-production quote data or test doubles. Do not use credentials, customer data, production records, or a live application session. Keep test names, routes, and fixture values source-derived rather than preselecting them in this task. <!-- authority: human-confirmed -->

If the recovered source does not establish a transition or behavior, record the evidence gap instead of creating a scenario for it. <!-- authority: llm-explicit -->

## Alternatives Considered

Test only the B2B interface. This was rejected because the documented quote lifecycle must be checked with the current pipeline behavior, not only a rendered view. <!-- authority: llm-explicit -->

Include quote-to-order conversion or pipeline-card navigation changes. This was rejected because conversion is listed as not started and missing click-through routes are a separate known issue. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the handoff describes a thin testing bar and the current repository exposes no B2B test source for inspection. Target: a repeatable source-selected regression suite covers every documented quote lifecycle state and transition plus relevant current pipeline behavior using synthetic non-production data. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: no safe quote-pipeline fixture is available in this repository. Target: every test input is synthetic or a test double, and the regression work does not use credentials, customer data, production records, or a live application session. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope adds discovery-gated regression coverage for current quote behavior and keeps not-started conversion work, navigation work, and contractual artifacts outside this task. <!-- authority: llm-explicit -->

### In scope

- Locate the quote pipeline implementation and test runner from the discovery output. <!-- authority: llm-explicit -->
- Add coverage for every documented quote lifecycle state and transition and relevant current pipeline behavior. <!-- authority: human-confirmed -->
- Use synthetic fixtures or test doubles and record the selected command and result. <!-- authority: human-confirmed -->
- Record an evidence gap when the recovered source does not establish behavior. <!-- authority: llm-explicit -->

### Out of scope

- Implement quote-to-order conversion, pipeline-card click-through routes, contracts, or purchase-order artifacts. <!-- authority: llm-explicit -->
- Change current quote behavior beyond regression coverage. <!-- authority: llm-explicit -->
- Use production data, credentials, or local application execution. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the application path and current test setup, or record them unavailable, before implementation starts. This is a discovery result rather than a dependency on an unnamed team. <!-- authority: human-confirmed -->

The handoff constraints against local application execution and committing secrets remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent routes, test paths, fixture values, or quote behavior that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
