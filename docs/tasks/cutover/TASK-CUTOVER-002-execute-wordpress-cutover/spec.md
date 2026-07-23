---
id: TASK-CUTOVER-002
title: "Execute the approved WordPress cutover"
template: task@1
type: chore
module: cutover
author: "@codex"
department: engineering
status: on_hold
entered_via: audit
priority: p1
created_at: "2026-07-23T05:55:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-CUTOVER-001
source_ref:
  - docs/01-vision.md:22-29
  - docs/01-vision.md:31-41
  - docs/02-architecture.md:3-26
  - docs/02-architecture.md:81-91
  - docs/07-status-roadmap.md:37
  - docs/07-status-roadmap.md:49-51
  - docs/README.md:19-25
provenance:
  - "source_path: docs/01-vision.md"
  - "source_hash: 85bd3a7365b7c6ed3eb5dc449e867b08316b23fb2b055db69a0d5ecb8f0cac23"
  - "source_refs: docs/01-vision.md:22-29,31-41; docs/02-architecture.md:3-26,81-91; docs/07-status-roadmap.md:37,49-51; docs/README.md:19-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

This conditional cutover task is on hold until `TASK-CUTOVER-001` supplies parity evidence, a backup is verified, a named rollback plan exists, the owner records a go decision, and a separate deployment instruction is issued. It authorizes no DNS, deployment, traffic, checkout, data, or WordPress-retirement action by itself. <!-- authority: human-confirmed -->

## Problem

The stated direction is to retire WordPress only after the Nuxt storefront reaches feature parity, while WordPress remains the live revenue store and `WpImport` continues during the transition. <!-- authority: llm-explicit -->

The handoff does not provide the required parity evidence, backup evidence, named rollback plan, owner go decision, deployment instruction, cutover window, DNS change, traffic plan, or authority to retire WordPress. <!-- authority: llm-explicit -->

## Proposed Solution

Hold this task until all five execution gates are recorded: `TASK-CUTOVER-001` parity evidence, verified backup, named rollback plan, owner go decision, and separate deployment instruction. When any gate is absent, record it as unmet and leave all live systems unchanged. <!-- authority: human-confirmed -->

Even after the gates are complete, this task records the authorization boundary and requires the separate deployment instruction before any action. It does not infer authority from the parity packet, a preview result, a task status, or this task's existence. <!-- authority: human-confirmed -->

## Alternatives Considered

Treat the parity packet as permission to cut over. This was rejected because parity evidence is not an owner go decision or a deployment instruction. <!-- authority: human-confirmed -->

Retire WordPress as soon as the new storefront is ready. This was rejected because the source says WordPress remains live until replacement and gives no retirement or traffic authority. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the target state is a Nuxt storefront at `sachviet.us`, but the live store remains WordPress during the transition. Target: every one of the five execution gates is recorded and independently reviewable before the task leaves on_hold. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff provides no live cutover instructions. Target: no DNS, deployment, traffic, live checkout, data migration, synchronization change, WordPress retirement, or production configuration action occurs unless a separate deployment instruction follows the completed gates. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is a conditional authorization record and gate checklist. It excludes every live action until all named gates and a separate deployment instruction exist. <!-- authority: llm-explicit -->

### In scope

- Read the parity evidence from `TASK-CUTOVER-001` and record whether it is complete enough for owner review. <!-- authority: human-confirmed -->
- Require a verified backup, named rollback plan, owner go decision, and separate deployment instruction before any live action. <!-- authority: human-confirmed -->
- Record an unmet or conflicting gate and retain on_hold status when it prevents a cutover. <!-- authority: human-confirmed -->
- Preserve an auditable distinction between readiness evidence, owner authority, and deployment authority. <!-- authority: human-confirmed -->

### Out of scope

- Change DNS, deploy, move traffic, exercise live checkout, change production configuration, or access a production admin session. <!-- authority: human-confirmed -->
- Alter or retire WordPress, stop `WpImport`, modify live data, or delete any legacy system. <!-- authority: human-confirmed -->
- Treat a task status, preview evidence, backup, or parity record as a substitute for owner and deployment authority. <!-- authority: human-confirmed -->

## Dependencies

`TASK-CUTOVER-001` must produce the source-confirmed parity packet and preview-only evidence before this task can be reviewed for release from on_hold. <!-- authority: human-confirmed -->

The verified backup, named rollback plan, owner go decision, and separate deployment instruction are independent execution gates. The owner must supply the deployment instruction before any live system change. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a cutover window, DNS plan, traffic plan, backup, rollback plan, owner decision, deployment command, or WordPress-retirement authority that recovered source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before releasing it from on_hold or authorizing implementation. <!-- authority: human-edited -->
