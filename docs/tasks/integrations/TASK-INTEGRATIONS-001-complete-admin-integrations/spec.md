---
id: TASK-INTEGRATIONS-001
title: "Complete Zalo and email settings screens"
template: task@1
type: feature
module: integrations
author: "@codex"
department: engineering
status: on_hold
entered_via: audit
priority: p2
created_at: "2026-07-23T05:53:01Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:32-34
  - docs/05-data-model.md:59-61
  - docs/06-tech-stack.md:52-57
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:32-34; docs/05-data-model.md:59-61; docs/06-tech-stack.md:52-57; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Complete the existing admin Zalo and email settings screens as a safe view and management surface for existing `Integration` and `Setting` records. Show provider state and non-secret metadata only, with no provider activation or outbound message. <!-- authority: human-confirmed -->

## Problem

The admin portal has a settings section, but its Zalo and email sub-pages still need completion and depend on integration credentials. The documented data model names `Integration` and `Setting`, but does not describe fields, provider actions, secret storage, or a screen contract. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` recovers the available application evidence, complete only the source-confirmed settings views for existing `Integration` and `Setting` data. Redact secret values, represent provider state through safe status indicators or non-secret metadata, and record any absent field or access rule as a gap. <!-- authority: human-confirmed -->

Do not activate Zalo or email, send a test message, add a provider, enter credentials, expose secrets, change queue behavior, or make an outbound request. An owner must separately provide credentials and explicit authority before any provider activation or transmission work begins. <!-- authority: human-confirmed -->

## Alternatives Considered

Build a full provider setup flow with credential entry and test sends. This was rejected because credentials and provider activation are owner-controlled blockers in the handoff. <!-- authority: llm-explicit -->

Create a new integration data model or infer secret storage. This was rejected because the handoff identifies existing `Integration` and `Setting` records without their implementation details. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the Zalo and email settings sub-pages are identified as incomplete and credential-blocked. Target: source-selected checks show that the recovered screens represent only existing settings data and never render a raw secret. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: no owner authority for provider activation or outbound messages is recorded. Target: source-selected checks show that this task performs no provider activation, credential entry, test message, or outbound request. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is limited to safe administration of source-confirmed existing integration settings. It is not an external-provider onboarding task. <!-- authority: llm-explicit -->

### In scope

- Recover the existing Zalo and email settings screen and data contract through `TASK-DISCOVERY-001`. <!-- authority: human-confirmed -->
- Complete only source-confirmed admin views and controls for existing `Integration` and `Setting` records. <!-- authority: human-confirmed -->
- Redact secrets and record unsupported settings fields, access rules, or provider state as gaps. <!-- authority: human-confirmed -->

### Out of scope

- Add provider activation, credential entry, credential rotation, test messages, outbound requests, templates, or queue changes. <!-- authority: human-confirmed -->
- Invent a provider, endpoint, storage scheme, secret field, or access policy. <!-- authority: llm-explicit -->
- Run the application locally, use production credentials, commit secrets, deploy, or spend money without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must recover the available application evidence before a settings field, screen behavior, or authorization boundary is implemented. <!-- authority: human-confirmed -->

Credentials, provider activation, outbound messages, spending, and admin-session actions remain explicit owner gates outside this task. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting the handoff and approved default into this task. <!-- authority: human-confirmed -->
- Scope: The task limits work to source-confirmed existing settings and secret-safe presentation. <!-- authority: llm-explicit -->
- Human review: An operator must authorize credentials, provider activation, or outbound messages before any later work expands this scope. <!-- authority: human-edited -->
