---
id: TASK-MIGRATION-001
title: "Reconcile unmatched WordPress order items"
template: task@1
type: improvement
module: migration
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p3
created_at: "2026-07-23T04:16:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/07-status-roadmap.md:46
  - docs/05-data-model.md:66-69
  - docs/01-vision.md:27-29
  - docs/README.md:21-25
provenance:
  - "source_path: docs/07-status-roadmap.md"
  - "source_hash: 2104f7ddad7ac430bfa2629d9a2708477e8f3d9e1f4520bbde5545c894ff9fb3"
  - "source_refs: docs/07-status-roadmap.md:46; docs/05-data-model.md:66-69; docs/01-vision.md:27-29; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Classify and reconcile source-visible unmatched WordPress order items after discovery identifies the current `WpImport` source and legacy import data. Preserve legacy identifiers and make no destructive data change without the required backup and operator instruction. <!-- authority: human-confirmed -->

## Problem

The handoff reports 324 unmatched WordPress order items caused by Vietnamese slug edge cases. WordPress remains the live legacy store while one-way `WpImport` continues to sync data into the new platform. <!-- authority: llm-explicit -->

Imported rows carry legacy identifiers, and the documented `WpImport` order match uses billing email to user ID plus total amount. The available repository does not contain the current import source, legacy data, mismatch set, or matching details needed to name a safe reconciliation action. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies the `WpImport` source and available legacy import data, classify each source-visible unmatched item and record a source-derived reconciliation outcome. Preserve legacy identifiers and use only recovered matching behavior. <!-- authority: human-confirmed -->

Do not bulk-match by slug heuristics, alter matching rules without evidence, or run a production re-import as verification. If a persistent reconciliation action is proposed, require the project backup convention and explicit operator instruction before it occurs. <!-- authority: human-confirmed -->

## Alternatives Considered

Bulk-match records by slug heuristics. This was rejected because the documented mismatch cause does not establish safe matching behavior and an incorrect match can corrupt imported data. <!-- authority: llm-explicit -->

Redesign the import model before examining the current source and data. This was rejected because the documented data flow and legacy identifiers must first be preserved and understood. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the handoff reports WordPress order items unmatched because of Vietnamese slug edge cases. Target: each source-visible unmatched item has a source-derived classification and recorded reconciliation outcome without unapproved destructive data changes. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: WordPress remains the live legacy store and imported rows carry legacy identifiers. Target: the work preserves source-confirmed legacy identifiers, matching behavior, and current production data unless an operator separately authorizes a backed-up persistent change. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope classifies and reconciles source-visible legacy mismatches with recovered import evidence. It excludes import-model redesign, unverified matching rules, and production re-import. <!-- authority: llm-explicit -->

### In scope

- Locate the current `WpImport` source, legacy import data, and source-visible mismatch set from the discovery output. <!-- authority: llm-explicit -->
- Classify each source-visible unmatched item and record a source-derived reconciliation outcome. <!-- authority: human-confirmed -->
- Preserve legacy identifiers and observed import matching behavior. <!-- authority: human-confirmed -->
- Record an evidence gap when source data does not establish a safe outcome. <!-- authority: human-confirmed -->

### Out of scope

- Redesign the import model, change matching rules without source evidence, or bulk-match by slug heuristics. <!-- authority: llm-explicit -->
- Run a production re-import or other destructive data action as part of verification. <!-- authority: human-edited -->
- Make a persistent data change without the required backup and explicit operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the application path, current `WpImport` source, legacy import data, and mismatch evidence, or record each unavailable, before implementation starts. This is a discovery result rather than a dependency on an unnamed team. <!-- authority: human-confirmed -->

Any persistent reconciliation action needs the project's required backup and explicit operator instruction. This is an execution control, not authorization to change production data. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a matching rule, source record, slug heuristic, reconciliation outcome, import path, or destructive data action that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
