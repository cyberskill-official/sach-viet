---
id: TASK-NOTIFICATIONS-001
title: "Verify notification badge and deeplink behavior"
template: task@1
type: improvement
module: notifications
author: "@codex"
department: engineering
status: testing
entered_via: audit
priority: p0
created_at: "2026-07-23T04:05:15Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:26
  - docs/03-portals.md:62-67
  - docs/07-status-roadmap.md:22
  - docs/07-status-roadmap.md:58
  - docs/06-tech-stack.md:34
  - docs/06-tech-stack.md:46
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:26,62-67; docs/07-status-roadmap.md:22,58; docs/06-tech-stack.md:34,46; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Verify the documented notification badge and deeplink behavior across the five stated portals after discovery identifies the notification paths and a secure route to approved owner test accounts. Record source-confirmed results and do not change notification behavior as part of verification. <!-- authority: human-confirmed -->

## Problem

The notification backend and per-portal preference pages are documented as done, while badge and deeplink end-to-end verification remains pending across five portals and needs owner login. <!-- authority: llm-explicit -->

The available repository does not contain the application source, notification paths, test-account access, or current preview behavior needed to name a test route, account, fixture, or expected result. Those details must come from discovery and approved test access instead of assumption. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies the notification implementation and secure test-account route, define a repeatable preview verification for each documented portal. Check the current badge and deeplink behavior using approved non-production access and record any source-confirmed variance. <!-- authority: human-confirmed -->

Keep credentials outside task artifacts and do not use production records or a local application session. If discovery cannot establish a secure access route or the expected behavior, record the evidence or access gap instead of inventing a test result. <!-- authority: human-confirmed -->

## Alternatives Considered

Verify only one portal. This was rejected because the handoff explicitly calls for badge and deeplink verification across five portals. <!-- authority: llm-explicit -->

Add real-time notification delivery while verifying current behavior. This was rejected because real-time delivery is separate work that requires a Reverb, Pusher, or polling decision. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: notification backend and preferences are documented as done, while badge and deeplink end-to-end verification is pending across five portals. Target: a repeatable preview verification records badge and deeplink results for each documented portal using approved test access, with any variance recorded. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: owner login is named as a requirement, and no test-account material is present in this repository. Target: credentials remain outside task artifacts and every verification input is approved non-production access or a source-confirmed test fixture. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope verifies current notification behavior after secure access and source details are known. It excludes real-time delivery, preference or backend changes, and behavior that the recovered source does not establish. <!-- authority: llm-explicit -->

### In scope

- Locate the notification paths, documented portal set, and safe preview verification method from the discovery output. <!-- authority: llm-explicit -->
- Verify source-confirmed badge and deeplink behavior for each documented portal using approved non-production test access. <!-- authority: human-confirmed -->
- Record a source-confirmed variance, evidence gap, or access gap when a result cannot be established. <!-- authority: human-confirmed -->
- Keep credentials outside the repository and task artifacts. <!-- authority: human-edited -->

### Out of scope

- Implement real-time notifications, change notification preferences, or change notification backend behavior. <!-- authority: llm-explicit -->
- Use production data, customer data, unapproved accounts, or a local application session. <!-- authority: human-edited -->
- Commit credentials, deploy, or change application configuration without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the notification implementation, preview verification method, and secure test-account route, or record each unavailable, before implementation starts. This is a discovery result rather than a dependency on an unnamed team. <!-- authority: human-confirmed -->

Approved owner test access is an execution precondition. If it is unavailable, preserve the task evidence and report the access gap without requesting or storing credentials in the repository. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a portal list, notification route, deeplink destination, account, credential, or expected behavior that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
