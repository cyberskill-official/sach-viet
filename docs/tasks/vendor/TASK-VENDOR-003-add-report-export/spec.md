---
id: TASK-VENDOR-003
title: "Add vendor report export"
template: task@1
type: feature
module: vendor
author: "@codex"
department: engineering
status: on_hold
entered_via: audit
priority: p1
created_at: "2026-07-23T05:48:55Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-VENDOR-002
source_ref:
  - docs/03-portals.md:28-30
  - docs/07-status-roadmap.md:24
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:28-30; docs/07-status-roadmap.md:24; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Replace the documented vendor report-download stub with an on-demand UTF-8 CSV for the authenticated vendor. Export only the recovered current dashboard fields and filters, and do not retain or send the report after download. <!-- authority: human-confirmed -->

## Problem

The vendor portal report calls the analytics dashboard mocked and the report download a stub. The handoff does not define a report format, field set, audience beyond the vendor portal, delivery method, or retention rule. <!-- authority: llm-explicit -->

`TASK-VENDOR-002` must first establish which dashboard data and filters are source-confirmed. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-VENDOR-002`, add an on-demand UTF-8 CSV export for the authenticated vendor using only the recovered dashboard fields and active filters. Generate it for the requesting vendor context and do not persist a report copy, email it, schedule it, or place it in object storage. <!-- authority: human-confirmed -->

If recovered source does not establish a field, filter, or vendor authorization boundary, record the gap and exclude it from the export. Do not add PII, financial semantics, or data beyond the current dashboard display. <!-- authority: human-confirmed -->

## Alternatives Considered

Create a scheduled report service with stored files and email delivery. This was rejected because the handoff does not define delivery, storage, or retention behavior. <!-- authority: llm-explicit -->

Choose a new report format or field catalogue. This was rejected because the source only establishes a stub and current vendor dashboard context. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the vendor report download is a documented stub. Target: an authenticated vendor can request an on-demand UTF-8 CSV that contains only the recovered current dashboard fields and filters for that vendor context. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff does not define report retention or alternate delivery. Target: source-selected checks show that the export is not stored, emailed, scheduled, or exposed outside its authenticated vendor scope. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is a small download capability tied to recovered vendor analytics. It excludes a reporting service or data warehouse. <!-- authority: llm-explicit -->

### In scope

- Use the dashboard fields, filters, and vendor access boundary established by `TASK-VENDOR-002`. <!-- authority: llm-explicit -->
- Produce an on-demand UTF-8 CSV for the authenticated vendor context. <!-- authority: human-confirmed -->
- Record a field, filter, or authorization gap instead of guessing. <!-- authority: human-confirmed -->

### Out of scope

- Add scheduled exports, email delivery, persistent report storage, object storage, or retention policies. <!-- authority: llm-explicit -->
- Add fields, PII, financial calculations, report templates, or cross-vendor access. <!-- authority: llm-explicit -->
- Run the application locally, use production data, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-VENDOR-002` must establish the recovered vendor dashboard data contract and access boundary before implementation begins. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting the handoff and approved default into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent report storage, delivery, field definitions, financial calculations, or retention rules. <!-- authority: llm-explicit -->
- Human review: An operator must approve any future delivery, storage, or retention expansion before it is added to scope. <!-- authority: human-edited -->
