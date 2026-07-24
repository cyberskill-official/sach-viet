---
id: TASK-REBUILD-020
title: "Build Vietnamese search"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
shipped: "2026-07-24"
priority: p0
created_at: "2026-07-24T00:00:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-004
source_ref:
  - docs/03-portals.md:9-26
  - docs/06-tech-stack.md:29-35,43-50
  - docs/07-status-roadmap.md:29-44
provenance:
  - "source_path: docs/06-tech-stack.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
  - "search_decision: local Vietnamese-aware search backend by default; optional env-gated Meilisearch HTTP seam; no paid SaaS lock-in"
  - "related_on_hold: docs/tasks/search/TASK-SEARCH-001-add-vietnamese-fuzzy-search (leave on_hold)"
---

# Task

## Summary

Build greenfield Vietnamese-aware public catalog search in `app/web`: diacritic-insensitive matching, light typo tolerance, suggestions, and append-only search analytics over Task 4 catalog products, with a local in-process backend as the default so CI runs without an external search service, and an optional env-gated Meilisearch HTTP seam that does not lock a paid SaaS. <!-- authority: human-confirmed -->

## Problem

The storefront roadmap calls for fuzzy search that handles Vietnamese diacritics, and the tech stack names Meilisearch (self-host on CapRover) as a trigger-gated upgrade while listing Meilisearch timing and Vietnamese analyzer config as an open discussion. Greenfield catalog reads (`listPublicProducts`) support category filters only — no `q` search, no diacritic folding, no suggestions, and no `search_logs` analytics trail the data model names. <!-- authority: llm-explicit -->

Requiring Meilisearch (or Algolia/Typesense Cloud) before this task can ship would invent an irreversible hosting/vendor commitment the sources leave open, and would break credential-free CI. Non-rebuild `TASK-SEARCH-001` stays on hold under the greenfield-only decision and must not be reopened. <!-- authority: human-confirmed -->

## Proposed Solution

Add a `vietnamese-search-core` module (or equivalent) in `app/web` that:

1. Normalizes Vietnamese text for search (Unicode-aware diacritic folding, lowercase, whitespace collapse) so queries like `sach` and `tieng viet` match titles such as `Sách` and `Tiếng Việt`. <!-- authority: human-confirmed -->
2. Scores and ranks public catalog documents (title, description, slug, category name) with deterministic ordering and light typo tolerance suitable for short book titles, without requiring a network service. <!-- authority: llm-explicit -->
3. Defines a closed `SearchBackend` adapter with a **local** default (`mode: "local"`) that searches an in-memory/SQLite-backed document set derived from Task 4 public products. Optionally, when non-secret env configuration is present (for example a Meilisearch base URL), resolve an env-gated HTTP Meilisearch seam (`mode: "meilisearch"`) that accepts an injected fetch/submitter — never hard-code a paid SaaS SDK, account signup, or cloud host brand as the platform default. <!-- authority: human-confirmed -->
4. Persists append-only `search_logs` rows with normalized query, result count, backend mode, and timestamp; omit raw session tokens and do not store free-text that is not the public query string itself. <!-- authority: llm-explicit -->
5. Exposes suggestions from prior successful queries and/or catalog titles for short prefixes. <!-- authority: llm-explicit -->

Wire public catalog search into the existing storefront catalog surface: extend `GET /api/catalog/products` with an optional `q` parameter (and keep `category`), and add `GET /api/catalog/search/suggestions?q=` for suggestion reads. Empty or whitespace-only `q` MUST fall back to the existing category/list behavior without inventing ranked noise. Leave Task 4 catalog ownership, offer/buy-box rules, email/Zalo adapters, notification/SSE, and publisher/author portals intact. Leave `TASK-SEARCH-001` unchanged. <!-- authority: human-confirmed -->

## Alternatives Considered

Require Meilisearch as the only backend before the task can pass CI. This is rejected because Meilisearch timing/analyzer config remains an open discussion, CapRover service provisioning is out of band for greenfield CI, and a local Vietnamese-aware backend satisfies diacritic search without irreversible lock-in. <!-- authority: human-confirmed -->

Lock Algolia, Typesense Cloud, Elasticsearch Cloud, or another paid search SaaS as the platform default. This is rejected because the sources do not authorize paid SaaS spend, and standing orders forbid inventing paid lock-in. <!-- authority: human-confirmed -->

Reopen or implement `TASK-SEARCH-001` (complaint + owner-approval gated Meilisearch install). This is rejected under the greenfield-only decision and standing orders to leave non-rebuild `on_hold` tasks alone. <!-- authority: human-confirmed -->

Ship only ASCII `LIKE` substring matching without Vietnamese folding. This is rejected because the storefront need is explicitly Vietnamese-diacritic search quality. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: greenfield catalog reads have category filters only; no `q` search, suggestions, or search logs. Target: tests prove diacritic-insensitive matches (folded query finds accented titles), light typo tolerance on short titles, deterministic ranking, suggestions for prefixes, append-only search_logs rows, local backend default without network I/O, optional Meilisearch seam activates only when env configuration is present in tests, and empty `q` preserves existing list/category behavior. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: sources forbid paid SaaS lock-in without decision and leave Meilisearch timing open. Target: tests prove no paid search SaaS SDK is introduced as the platform default, local mode never opens a network socket, Task 4 buy-box/catalog ownership remains intact, email/Zalo/notification/SSE/publisher/author artefacts are not mutated for ownership, and `TASK-SEARCH-001` stays on_hold. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

This task establishes Vietnamese-aware public catalog search with a local default backend and optional Meilisearch HTTP seam. It does not provision CapRover Meilisearch, choose a paid SaaS, or reopen on-hold legacy search work. <!-- authority: llm-explicit -->

### In scope

- Vietnamese text normalization (diacritic folding) and local fuzzy/score ranking over public catalog fields. <!-- authority: human-confirmed -->
- Closed `SearchBackend` adapter with local default and optional env-gated Meilisearch HTTP seam (injected submitter; no paid SaaS SDK default). <!-- authority: human-confirmed -->
- Append-only `search_logs` analytics and prefix suggestions. <!-- authority: llm-explicit -->
- Public API wiring: optional `q` on catalog products list + suggestions endpoint. <!-- authority: human-confirmed -->
- Core/route tests and a verify script proving folding, ranking, logs, local default, and no paid SaaS lock-in. <!-- authority: llm-explicit -->

### Out of scope

- Choose or hard-code Algolia, Typesense Cloud, Elasticsearch Cloud, or any paid search SaaS as the platform default. <!-- authority: human-confirmed -->
- Require a live Meilisearch container, CapRover one-click app, or production index provisioning for CI/gates. <!-- authority: human-confirmed -->
- Private-data search (accounts, orders, institutional, vendor-internal, unpublished content). <!-- authority: llm-explicit -->
- Semantic/embedding search, personalization ML, or multi-language stemming beyond Vietnamese diacritic folding + light typo tolerance. <!-- authority: llm-explicit -->
- Mutate `TASK-SEARCH-001`, email/Zalo adapters, notification/SSE cores, publisher/author portals, or Task 4 offer/buy-box ownership. <!-- authority: human-confirmed -->

## Dependencies

Task 4 provides the public catalog product documents this search ranks. Later storefront UI polish may consume the same `q` and suggestions APIs. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented Vietnamese search / Meilisearch roadmap gap and greenfield vendor constraints into this rebuild task. <!-- authority: human-confirmed -->
- Scope: The task builds local Vietnamese-aware catalog search with an optional Meilisearch HTTP seam; it excludes paid SaaS lock-in and CapRover Meilisearch provisioning. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue, session-wide routine acceptance gates, and standing orders to prefer solutions without inventing paid SaaS lock-in and to pause only for irreversible vendor choices. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-020.*
