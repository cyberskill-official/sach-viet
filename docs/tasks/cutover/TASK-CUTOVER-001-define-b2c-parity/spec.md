---
id: TASK-CUTOVER-001
title: "Define and verify B2C parity before cutover"
template: task@1
type: chore
module: cutover
author: "@codex"
department: engineering
status: on_hold
entered_via: audit
priority: p1
created_at: "2026-07-23T05:54:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/01-vision.md:22-29
  - docs/01-vision.md:31-41
  - docs/02-architecture.md:3-26
  - docs/02-architecture.md:81-91
  - docs/07-status-roadmap.md:7-16
  - docs/07-status-roadmap.md:37
  - docs/07-status-roadmap.md:49-51
  - docs/README.md:19-25
provenance:
  - "source_path: docs/01-vision.md"
  - "source_hash: 85bd3a7365b7c6ed3eb5dc449e867b08316b23fb2b055db69a0d5ecb8f0cac23"
  - "source_refs: docs/01-vision.md:22-29,31-41; docs/02-architecture.md:3-26,81-91; docs/07-status-roadmap.md:7-16,37,49-51; docs/README.md:19-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Create a non-destructive B2C parity readiness packet and preview-only dry-run record for a future cutover. WordPress remains the live store, and this task must not change DNS, deploy either application, exercise live checkout, move traffic, or retire WordPress. <!-- authority: human-confirmed -->

## Problem

The new Nuxt and Laravel platform is intended to replace the live WordPress store after B2C feature parity, while WordPress remains live and `WpImport` continues one-way synchronization until replacement. <!-- authority: llm-explicit -->

The handoff does not define a complete parity checklist, owner-approved acceptance criteria, exact preview accounts, rollback procedure, backup location, cutover window, DNS plan, or a deployment authorization. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies source-confirmed B2C flows and safe preview evidence, prepare a parity packet that lists the recovered flows, current known gaps, preview-only dry-run evidence, and unresolved conditions. The packet is evidence for an owner review and does not constitute a go decision. <!-- authority: human-confirmed -->

Use approved preview access only if the owner provides it through the appropriate channel. Keep the legacy WordPress store live, preserve current synchronization, and stop at an evidence gap rather than assuming parity or performing any live action. <!-- authority: human-confirmed -->

## Alternatives Considered

Switch traffic once the new storefront appears complete. This was rejected because the source requires feature parity before cutover and says WordPress remains live until Nuxt parity. <!-- authority: llm-explicit -->

Perform a live checkout as a parity test. This was rejected because the approved default limits the task to a preview-only dry run and no live checkout action. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: the new platform has a B2C storefront and the legacy WordPress store remains live until feature parity. Target: the readiness packet records each source-confirmed B2C flow, known gap, preview-only dry-run result, and evidence gap without claiming unverified parity. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff provides no cutover window, DNS plan, rollback plan, or deployment authorization. Target: source-selected checks show that this task does not change DNS, deploy, send live traffic, exercise live checkout, alter synchronization, or retire WordPress. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope creates a readiness packet and preview-only evidence record. It excludes a cutover decision and every production change. <!-- authority: llm-explicit -->

### In scope

- Locate source-confirmed B2C flows, current preview paths, current synchronization behavior, and documented known gaps. <!-- authority: llm-explicit -->
- Prepare a parity packet that distinguishes verified preview evidence, source-confirmed gaps, and unavailable evidence. <!-- authority: human-confirmed -->
- Conduct a preview-only dry run only with approved non-production access and without live checkout or traffic movement. <!-- authority: human-confirmed -->
- State the conditions still needed for an owner go or no-go decision, backup plan, rollback plan, and separate deployment instruction. <!-- authority: human-confirmed -->

### Out of scope

- Change DNS, deploy web or API services, move traffic, change production configuration, or send a live checkout transaction. <!-- authority: human-confirmed -->
- Retire WordPress, stop `WpImport`, alter legacy data, or alter the legacy store. <!-- authority: human-confirmed -->
- Store credentials, use an unapproved account, or make an admin-session action without separate operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the application paths, source-confirmed B2C flows, current preview route, and current synchronization evidence, or record each unavailable, before implementation starts. <!-- authority: human-confirmed -->

Owner-provided preview access is an execution precondition. Any eventual go decision, backup, rollback plan, DNS change, deployment, or traffic action belongs to `TASK-CUTOVER-002` and requires separate owner authority. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent parity criteria, a preview account, DNS plan, deployment process, rollback procedure, cutover time, backup location, or authorization that recovered source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
