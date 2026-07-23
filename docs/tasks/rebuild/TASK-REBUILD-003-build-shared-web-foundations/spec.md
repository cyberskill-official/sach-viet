---
id: TASK-REBUILD-003
title: "Build shared web foundations"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: ready_to_implement
priority: p0
created_at: "2026-07-23T00:00:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-001
  - TASK-REBUILD-002
source_ref:
  - docs/02-architecture.md:28-70
  - docs/03-portals.md:62-68
  - docs/06-tech-stack.md:3-14
provenance:
  - "source_path: docs/02-architecture.md"
  - "source_hash: 5f8e397921ba3cd0661924ae6e3b23afb868506844a36ef4689f79e3661ae943"
  - "operator_resolution: greenfield rebuild on 2026-07-23"
---

# Task

## Summary

Build the shared Nuxt web structure used by all SachViet portals: portal layouts, navigation shell, i18n setup, theme behavior, shared API access, and reusable UI components. This is a greenfield implementation of the documented web structure. <!-- authority: human-confirmed -->

## Problem

The handoff describes nine portal page roots, shared components, portal layouts, middleware, Pinia stores, composables, server routes, and Vietnamese and English locales. The new workspace has no shared web implementation yet. <!-- authority: llm-explicit -->

The platform requires a light, dark, and glass theme, while some legacy pagination text was hardcoded in Vietnamese. The rebuild must establish localization at the shared-component layer instead of carrying forward that gap. <!-- authority: llm-explicit -->

## Proposed Solution

Create the documented Nuxt folder structure for portal pages, layouts, shared components, middleware, stores, composables, server proxy routes, and vi/en locale files. Provide reusable portal-shell and data-table foundations that later tasks extend without duplicating portal access behavior. <!-- authority: human-confirmed -->

Keep the established Tailwind and liquid-glass visual direction, including reduced-motion support where the source specifies it. Route access remains delegated to the identity and access foundation. <!-- authority: llm-explicit -->

## Alternatives Considered

Build each portal with its own unrelated layout and component set. This was rejected because the handoff identifies shared layouts and components as common platform structure. <!-- authority: llm-explicit -->

Ship only Vietnamese strings and add English later. This was rejected because the handoff defines vi/en as current platform support. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the new workspace has no shared portal web layer. Target: later portal tasks can use one documented shared layout, API-access, theme, and vi/en localization foundation. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: shared pagination text was identified as a hardcoded-language issue. Target: new shared UI text resolves through the vi/en localization mechanism rather than a hardcoded Vietnamese string. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

The task creates shared web infrastructure only. It does not implement the business pages, domain API contracts, or portal-specific workflows owned by later tasks. <!-- authority: llm-explicit -->

### In scope

- Create portal page, layout, component, middleware, store, composable, server, and locale foundations described by the architecture. <!-- authority: llm-explicit -->
- Establish shared portal shells, theme behavior, i18n, API-access abstractions, and data-table text handling. <!-- authority: human-confirmed -->
- Add source-selected checks for locale resolution and shared component behavior. <!-- authority: human-confirmed -->

### Out of scope

- Implement portal business features, data models, payments, or external integrations. <!-- authority: llm-explicit -->
- Bypass the identity and access controls from TASK-REBUILD-002. <!-- authority: llm-explicit -->
- Copy legacy source components or theme assets without explicit approval. <!-- authority: human-confirmed -->

## Dependencies

TASK-REBUILD-001 supplies the Nuxt workspace and TASK-REBUILD-002 supplies portal access controls. This task supplies the reusable web layer for later portal tasks. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented web architecture into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent page behavior, API endpoints, visual assets, or localization copy not present in the source. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield authoring plan before this task was drafted. <!-- authority: human-confirmed -->
