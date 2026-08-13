---
id: TASK-SRCH-002
title: "Postgres FTS/trigram search; stop hydrate-all then rank"
template: task@1
type: feature
module: search
author: "@cursor"
department: engineering
status: ready_to_implement
entered_via: golive_wave
priority: p1
created_at: "2026-08-13T05:08:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DATA-001
  - TASK-UI-001
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-20
  - docs/plans/sachviet-full-production-completion-plan.md#FL-B2C-03
provenance:
  - "source_path: docs/plans/sachviet-full-production-completion-plan.md"
  - "source_path: /Users/stephencheng/.cursor/plans/local-complete_golive_wave_1b3ef2a9.plan.md"
  - "operator_resolution: local-complete golive wave 0 2026-08-13"
---

# Task

## Summary

Replace unbounded `listPublicProducts` plus in-process rank with Postgres `tsvector` / `pg_trgm` in an additive migration (`PKG-20`, `FL-B2C-03`). Keep the Meilisearch seam optional/off. Search must not load all products to rank. <!-- authority: llm-explicit -->

## Problem

`app/web/src/lib/vietnamese-search-core.mjs` calls `listPublicProducts` without a bound and ranks in process. `FL-B2C-03` requires indexed Postgres search that recovers from timeout without loading all products. TASK-SEARCH-001 is closed (Meilisearch gated); TASK-REBUILD-020 stays done. This new ID carries the Postgres FTS/trigram slice. <!-- authority: llm-explicit -->

## Proposed Solution

Additive migration for `tsvector` and `pg_trgm` indexes on public catalog text. Query in the database with a bounded limit and cursor; normalize Vietnamese input; return ranked pages and bounded suggestions. Do not hydrate the full catalog then rank. Meilisearch remains optional/off — do not stand up a Meilisearch service. New/changed search handlers follow TASK-API-001 envelope/cursor when that task has landed, or match its contract if implemented together. <!-- authority: llm-explicit -->

Routes and authz: existing public catalog/search routes; no new privileged search surface. <!-- authority: llm-explicit -->

## Alternatives Considered

Stand up Meilisearch now. Rejected — TASK-SEARCH-001 stays closed; golive wave keeps Meilisearch optional/off. <!-- authority: llm-explicit -->

Reopen TASK-REBUILD-020. Rejected — that task is done; this ID carries the leftover. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: search hydrates all then ranks. Target: bounded Postgres FTS/trigram query; tests prove it does not load the full catalog; `npm test` covers the named tests. Deadline: before reviewing → ready_to_test. <!-- authority: llm-explicit -->

Guardrail - baseline: Production may already be live. Target: additive migration only; no Production deploy or merge from this task; no Meilisearch requirement. Deadline: ongoing. <!-- authority: llm-explicit -->

## Scope

### In scope

- Additive `tsvector` / `pg_trgm` migration and query path in `vietnamese-search-core.mjs` / catalog search. <!-- authority: llm-explicit -->
- Bounded suggestions and ranked pages; timeout recovery without hydrate-all. <!-- authority: llm-explicit -->
- Meilisearch seam stays optional/off. <!-- authority: llm-explicit -->
- Tests: core/handler tests that a catalog larger than the page size is not fully loaded to rank (for example extend or add `tests/vietnamese-search-core.test.mjs`); no source-grep route tests. <!-- authority: llm-explicit -->

### Out of scope

- Meilisearch cluster, US-region move, invented ranking SLAs, live keys, WordPress DNS, self-setting `done`. <!-- authority: llm-explicit -->

## Dependencies

`TASK-DATA-001` and `TASK-UI-001` are the in-flight audit set (async pg + storefront/search wiring). This task is eligible only after those complete HITL (`testing → done`). HITL remains required at reviewing → ready_to_test and testing → done. Do not request HITL while authoring. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Cursor agent authoring the local-complete golive wave queue. <!-- authority: llm-explicit -->
- Human review: Operator HITL at the two acceptance gates after implementation. <!-- authority: llm-explicit -->
