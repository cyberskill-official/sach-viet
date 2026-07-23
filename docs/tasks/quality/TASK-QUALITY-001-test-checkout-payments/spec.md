---
id: TASK-QUALITY-001
title: "Add checkout and hosted-payment regression coverage"
template: task@1
type: improvement
module: quality
author: "@codex"
department: engineering
status: testing
entered_via: audit
priority: p0
created_at: "2026-07-23T03:50:47Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/06-tech-stack.md:12
  - docs/06-tech-stack.md:17
  - docs/06-tech-stack.md:47
  - docs/07-status-roadmap.md:7
  - docs/README.md:21-23
provenance:
  - "source_path: docs/06-tech-stack.md"
  - "source_hash: 8c41ac63bd47446666b3ea682a2ec4a704bc7c0968393a0ddab5c088026f49c4"
  - "source_refs: docs/06-tech-stack.md:12,17,47; docs/07-status-roadmap.md:7; docs/README.md:21-23"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Add regression coverage for the documented B2C checkout flow and its hosted-payment boundary after the discovery task identifies the actual application and test paths. The work protects a money path without relying on production credentials or a live payment transaction. <!-- authority: human-confirmed -->

## Problem

The handoff says the frontend uses Vitest while API tests are minimal, and it describes the current testing bar as thin. It also identifies the B2C browse, cart, hosted checkout, and order-history path as a verified production-preview flow. <!-- authority: llm-explicit -->

The current repository does not include the application source tree or its tests, so a task spec cannot truthfully name files, routes, or provider callbacks yet. The discovery task is the prerequisite that records those sources or their unavailable status. <!-- authority: human-confirmed -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies usable source paths, map the current checkout implementation and its available test entry points. Add regression coverage that exercises the documented checkout path and hosted-payment boundary in the available test environment. <!-- authority: llm-explicit -->

Use purpose-made non-production fixtures or test doubles. Do not use live provider keys, execute a live payment, or copy production order data into the repository. The exact fixture fields and test names remain source-derived work after discovery rather than assumptions in this task. <!-- authority: human-confirmed -->

Document the supported and failure behavior that the available source exposes. If discovery cannot establish a behavior, record that evidence gap rather than infer provider callbacks or error states. <!-- authority: llm-explicit -->

## Alternatives Considered

Test only frontend components. This was rejected because the handoff proposes frontend and Laravel feature coverage for money paths, and the checkout flow crosses both application halves. <!-- authority: llm-explicit -->

Exercise the payment providers with production credentials. This was rejected because the handoff places live keys in production environments and prohibits committing secrets. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the handoff describes a thin testing bar and the current repository exposes no application test sources for inspection. Target: a documented regression suite exercises the B2C checkout flow and hosted-payment boundary in the available test environment without production credentials. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: no safe checkout fixture is available in this repository. Target: every test input is purpose-made non-production data or a test double, and no live payment occurs. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope adds source-derived regression coverage after discovery and keeps provider credentials, production data, and application deployment outside this task. <!-- authority: llm-explicit -->

### In scope

- Locate the current checkout and test paths from the discovery output. <!-- authority: llm-explicit -->
- Add source-derived regression coverage for the documented B2C checkout path and hosted-payment boundary. <!-- authority: llm-explicit -->
- Use purpose-made non-production fixtures or test doubles and document their safety boundary. <!-- authority: human-confirmed -->
- Record the observed supported and failure cases that the recovered source makes testable. <!-- authority: llm-explicit -->
- Record an evidence gap instead of a test scenario when the recovered source does not establish the behavior. <!-- authority: llm-explicit -->

### Out of scope

- Run the application locally, deploy a change, or initiate a live payment. <!-- authority: human-edited -->
- Retrieve, commit, or expose provider credentials, production order data, or customer data. <!-- authority: human-edited -->
- Change payment-provider contracts or application behavior beyond regression coverage. <!-- authority: llm-explicit -->

## Dependencies

`TASK-DISCOVERY-001` must provide accessible application or test paths, or record their unavailable status, before implementation starts. This task does not require a named provider contact because it must use non-production test data rather than live credentials. <!-- authority: human-confirmed -->

The existing handoff constraints against local application execution and committing secrets remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task contains no invented code paths, provider callbacks, or fixture values. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
