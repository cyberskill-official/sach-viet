---
id: TASK-I18N-001
title: "Localize DataTable pagination for vi and en"
template: task@1
type: improvement
module: i18n
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p2
created_at: "2026-07-23T04:12:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:67
  - docs/07-status-roadmap.md:41
  - docs/02-architecture.md:44
  - docs/02-architecture.md:50
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:67; docs/07-status-roadmap.md:41; docs/02-architecture.md:44,50; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Replace the source-confirmed hardcoded Vietnamese DataTable pagination text with the existing vi/en i18n mechanism after discovery identifies the component and locale contract. Keep the change limited to the affected pagination text. <!-- authority: human-confirmed -->

## Problem

The platform supports vi/en, but the handoff lists hardcoded Vietnamese text in `DataTable.vue` pagination as known technical debt. The architecture identifies DataTable as a shared component and vi/en locale files in the application tree. <!-- authority: llm-explicit -->

The available repository does not contain the component, locale files, message keys, or test setup needed to name exact strings or implementation paths. Those details must come from discovery instead of assumption. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies the actual DataTable component and locale setup, replace only the source-confirmed pagination text with messages from the existing i18n mechanism. Add source-selected checks for both vi and en behavior. <!-- authority: human-confirmed -->

If discovery cannot establish the component or locale contract, record the evidence gap instead of adding message keys, selecting a library API, or guessing translations. <!-- authority: human-confirmed -->

## Alternatives Considered

Translate the Vietnamese text without using the current i18n mechanism. This was rejected because the handoff identifies vi/en support and a shared locale setup. <!-- authority: llm-explicit -->

Broaden this work into a general i18n rewrite. This was rejected because the documented defect is limited to DataTable pagination text. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the handoff identifies DataTable pagination text as hardcoded Vietnamese. Target: the source-confirmed pagination text resolves through the existing i18n setup in both vi and en, with a repeatable source-selected check. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff identifies a shared DataTable component and vi/en locale files but no source is present here. Target: the change does not rename unrelated strings, add locales, replace the i18n mechanism, or invent message keys. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope localizes source-confirmed DataTable pagination text through existing application i18n behavior and keeps broad translation or framework changes outside this task. <!-- authority: llm-explicit -->

### In scope

- Locate the DataTable component, current pagination text, and locale contract from the discovery output. <!-- authority: llm-explicit -->
- Replace only the source-confirmed pagination text through the existing vi/en i18n mechanism. <!-- authority: human-confirmed -->
- Add source-selected checks for vi and en resolution. <!-- authority: human-confirmed -->
- Record an evidence gap if discovery cannot establish the component or locale contract. <!-- authority: human-confirmed -->

### Out of scope

- Translate unrelated strings, add locales, replace the i18n library, or create a general i18n rewrite. <!-- authority: llm-explicit -->
- Invent message keys, translations, component paths, or test paths not established by recovered source. <!-- authority: llm-explicit -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the application path, DataTable component, locale contract, and current check method, or record each unavailable, before implementation starts. This is a discovery result rather than a dependency on an unnamed team. <!-- authority: human-confirmed -->

The handoff constraints against local application execution, public repositories, and committed secrets remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a component path, i18n API, message key, translation, locale, or test path that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
