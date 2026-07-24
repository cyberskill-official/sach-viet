---
id: TASK-NOTIFICATIONS-002
title: "Add live notification delivery"
template: task@1
type: feature
module: notifications
author: "@codex"
department: engineering
status: closed
entered_via: audit
priority: p2
created_at: "2026-07-23T05:50:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-NOTIFICATIONS-001
source_ref:
  - docs/03-portals.md:62-67
  - docs/05-data-model.md:55-62
  - docs/06-tech-stack.md:29-35
  - docs/06-tech-stack.md:43-49
  - docs/07-status-roadmap.md:22
  - docs/07-status-roadmap.md:33
  - docs/README.md:21-25
provenance:
  - "closed_as_superseded: TASK-REBUILD-011 on 2026-07-24 (operator session judgment; see docs/tasks/rebuild/.workflow/on-hold-supersession-2026-07-24.md)"
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:62-67; docs/05-data-model.md:55-62; docs/06-tech-stack.md:29-35,43-49; docs/07-status-roadmap.md:22,33; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Create a provider-neutral delivery adapter contract for the existing in-app notification system after the current bell behavior is verified. Preserve the in-app bell and preferences, and do not configure a live-push provider, socket service, or polling service in this task. <!-- authority: human-confirmed -->

## Problem

The notification backend and per-portal preferences are documented as present, while real-time delivery is not built and the choice between Reverb, Pusher, and polling remains open. <!-- authority: llm-explicit -->

The handoff does not provide the notification event code, browser contract, provider account, capacity need, or owner choice needed to configure live delivery safely. <!-- authority: llm-explicit -->

## Proposed Solution

Use the verified existing notification inputs to define a source-confirmed internal delivery adapter boundary with explicit supported and unavailable outcomes. Retain current in-app behavior if no adapter is configured, and ensure a later provider decision can attach at that boundary without changing notification preferences or event ownership. <!-- authority: human-confirmed -->

Do not create provider accounts, add provider credentials, establish WebSocket or SSE connections, enable polling, or send browser push in this task. If recovered source cannot identify a safe notification input and current fallback behavior, record the gap and leave the adapter inactive. <!-- authority: human-confirmed -->

## Alternatives Considered

Configure Reverb immediately. This was rejected because the stack guidance makes real-time delivery conditional on a live-push need and names the provider strategy as an open discussion. <!-- authority: llm-explicit -->

Configure Pusher immediately. This was rejected because the source does not provide an owner selection, provider account, spending approval, or credentials. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the in-app notification backend and preferences exist, while real-time delivery is not built. Target: source-selected checks show that the adapter accepts only recovered notification inputs, preserves the current in-app fallback, and exposes no active live-delivery transport. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: Reverb, Pusher, and polling are open choices, and credentials require owner involvement. Target: no provider account, credential, browser connection, polling loop, external message, or production configuration is created by this task. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope adds an inactive adapter boundary around recovered notification behavior. It excludes provider selection, provider setup, external delivery, and changes to the in-app bell or preferences. <!-- authority: llm-explicit -->

### In scope

- Use `TASK-NOTIFICATIONS-001` evidence to identify the current in-app notification behavior and a source-confirmed fallback. <!-- authority: human-confirmed -->
- Define an internal adapter contract using only notification event inputs and fallback behavior that recovered source establishes. <!-- authority: human-confirmed -->
- Verify inactive-adapter behavior and rejection of unsupported or absent input without changing current in-app behavior. <!-- authority: human-confirmed -->
- Record the provider decision, capacity need, or source detail that remains unavailable for a later task. <!-- authority: human-confirmed -->

### Out of scope

- Select, configure, pay for, or connect to Reverb, Pusher, polling, WebSocket, SSE, browser push, or any other delivery provider. <!-- authority: llm-explicit -->
- Change notification preferences, existing in-app bell behavior, portal routes, or notification-event ownership. <!-- authority: llm-explicit -->
- Store credentials, deploy, or use production data without a separate operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-NOTIFICATIONS-001` must provide source-confirmed current notification behavior or record the verification gap before implementation starts. This makes the adapter contract depend on observed in-app behavior rather than an assumed event shape. <!-- authority: human-confirmed -->

An owner decision remains required before any later task activates a live-delivery provider, spends money, uses an admin session, or supplies credentials. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a notification event schema, provider, connection method, credential, capacity target, or browser behavior that recovered source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
