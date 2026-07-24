---
id: TASK-QUALITY-002
title: "Add vendor payout regression coverage"
template: task@1
type: improvement
module: quality
author: "@codex"
department: engineering
status: done
entered_via: audit
priority: p0
created_at: "2026-07-23T03:54:05Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/05-data-model.md:30-36
  - docs/06-tech-stack.md:12
  - docs/06-tech-stack.md:47
  - docs/07-status-roadmap.md:13
  - docs/README.md:21-23
provenance:
  - "source_path: docs/05-data-model.md"
  - "source_hash: 6c59dd10d4d5e9ba1fe5ae8313f51428b1f6bd8d7b6176b49dc223e5192c8b1c"
  - "source_refs: docs/05-data-model.md:30-36; docs/06-tech-stack.md:12,47; docs/07-status-roadmap.md:13; docs/README.md:21-23"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Add regression coverage for the source-visible payout settlement relationship and implemented admin-managed payout behavior after discovery identifies the current application and test paths. The work uses isolated non-production data and does not alter payout policy or payment-provider settings. <!-- authority: human-confirmed -->

## Problem

The handoff describes `Payout` and `PayoutItem` records linked to `OrderItem`, with vendor settlement managed by administrators. It also lists payouts as an existing admin-portal capability while characterizing the current testing bar as thin. <!-- authority: llm-explicit -->

The current repository does not expose the payout code, its test runner, payout states, calculation rules, endpoints, or test files. Naming any of those details now would make an unsupported claim. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies the application source and current test setup, map the payout implementation and select the existing test layer from that source. Add focused regression coverage for the documented settlement relationship and the observed admin-managed behavior. <!-- authority: llm-explicit -->

Use isolated synthetic fixture data and record the chosen test command and result in task evidence. Do not use live customer, vendor, payment, or credential data, and do not create an assumed payout state or calculation rule. <!-- authority: human-confirmed -->

If the recovered source does not establish a behavior, record the evidence gap instead of creating a test scenario for it. <!-- authority: llm-explicit -->

## Alternatives Considered

Rely on manual preview checks only. This was rejected because the handoff identifies a thin testing bar and treats payouts as a money path requiring regression coverage. <!-- authority: llm-explicit -->

Create broad checkout or payment-provider tests instead. This was rejected because the available sources ground the settlement relationship, not an unverified provider contract. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the handoff describes a thin testing bar and the current repository exposes no payout test source for inspection. Target: a repeatable source-selected test command passes for each payout behavior selected from the recovered source contract, using isolated non-secret fixture data and recorded evidence. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: no safe payout fixture is available in this repository. Target: every test input is synthetic or a test double, and the regression work does not invoke a live payment, settlement, or credential. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope adds source-derived regression coverage and deliberately leaves product policy, provider configuration, and unknown implementation details outside this task. <!-- authority: llm-explicit -->

### In scope

- Locate the payout implementation and test runner from the discovery output. <!-- authority: llm-explicit -->
- Add coverage for the documented `Payout`, `PayoutItem`, and `OrderItem` relationship and observed admin-managed behavior. <!-- authority: llm-explicit -->
- Use isolated synthetic fixtures or test doubles and record the selected command and result. <!-- authority: human-confirmed -->
- Record an evidence gap when the recovered source does not establish a payout behavior. <!-- authority: llm-explicit -->

### Out of scope

- Change payout calculation rules, settlement policy, payment-provider setup, or database design. <!-- authority: llm-explicit -->
- Use production data, live payments, customer or vendor credentials, or local application execution. <!-- authority: human-edited -->
- Add vendor dashboard analytics or other behavior outside the payout regression boundary. <!-- authority: llm-explicit -->

## Dependencies

`TASK-DISCOVERY-001` must identify the application path and current test setup, or record them unavailable, before implementation starts. This is a discovery result rather than a dependency on an unnamed team or provider contact. <!-- authority: human-confirmed -->

The handoff constraints against local application execution and committing secrets remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent payout states, calculation rules, endpoints, test paths, or fixture values. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
