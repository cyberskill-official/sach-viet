---
id: TASK-VENDOR-002
title: "Add vendor dashboard analytics with real API data"
template: task@1
type: feature
module: vendor
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p1
created_at: "2026-07-23T05:47:20Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
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

Replace the documented mocked vendor dashboard analytics with recovered, vendor-scoped data. Keep the current source-confirmed labels as the only analytics contract until product owners define further KPI semantics. <!-- authority: human-confirmed -->

## Problem

The vendor portal has product CRUD, read-only incoming orders, and payout history, but its dashboard KPIs and charts are documented as mocked. The roadmap also calls the vendor analytics page mocked and its report download a stub. <!-- authority: llm-explicit -->

The repository does not contain the application source, so the dashboard's present fields, filters, data sources, and access controls must be recovered before implementation. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001`, inventory the existing vendor dashboard labels, widgets, filters, and vendor access boundary. Replace mock data only for source-confirmed widgets using recovered vendor-scoped data, while preserving the existing product, incoming-order, and payout-history boundaries. <!-- authority: human-confirmed -->

Do not define new KPIs, financial meanings, chart types, accounting rules, or report fields. Record an evidence gap when a displayed value or its source cannot be established from recovered source. <!-- authority: human-confirmed -->

## Alternatives Considered

Publish a new vendor KPI catalogue before source recovery. This was rejected because the handoff supplies no approved metric definitions. <!-- authority: llm-explicit -->

Treat payout history as authority to create new financial analytics. This was rejected because the handoff documents only the existing payout-history view. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the vendor dashboard analytics are mocked. Target: every widget included in this task uses a recovered source-confirmed vendor-scoped data contract or is recorded as an evidence gap. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: vendor products, incoming orders, and payout history have distinct documented boundaries. Target: source-selected checks show that an authenticated vendor sees only the data allowed by the recovered vendor scope and no new financial semantics are introduced. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope replaces existing mock analytics only. It excludes a new reporting or accounting product. <!-- authority: llm-explicit -->

### In scope

- Recover the current vendor dashboard labels, widgets, filters, data sources, and vendor authorization boundary. <!-- authority: llm-explicit -->
- Connect source-confirmed mocked widgets to recovered vendor-scoped data. <!-- authority: human-confirmed -->
- Record missing widget definitions or data sources as evidence gaps. <!-- authority: human-confirmed -->

### Out of scope

- Add KPI definitions, financial calculations, accounting rules, new charts, or historical backfill. <!-- authority: llm-explicit -->
- Implement report export, scheduled delivery, email, persistence, or a new object store. <!-- authority: llm-explicit -->
- Run the application locally, use production data, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must recover the vendor dashboard implementation and its access boundary before implementation begins. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting the handoff and approved default into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent vendor KPIs, financial calculations, chart contracts, or new data access. <!-- authority: llm-explicit -->
- Human review: An operator must review any unresolved KPI or financial meaning before it is added to scope. <!-- authority: human-edited -->
