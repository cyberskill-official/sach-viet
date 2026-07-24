---
id: TASK-REBUILD-003
title: "Build shared web foundations"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
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
  - docs/03-portals.md:62-68
  - docs/06-tech-stack.md:3-14
  - user decision: full-stack Next.js
provenance:
  - "source_path: docs/03-portals.md"
  - "operator_resolution: single full-stack Next.js application on 2026-07-24"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
---

# Task

## Summary

Build the shared Next.js web structure used by all SachViet portals: layouts, navigation shell, i18n, theme behavior, typed server-access helpers, and reusable UI components. This is a greenfield implementation of the documented shared-web intent. <!-- authority: human-confirmed -->

## Problem

The handoff describes nine portal roots, shared components, portal layouts, route guards, state, and Vietnamese and English locales. The new Next.js workspace has no shared portal implementation yet. <!-- authority: llm-explicit -->

The platform requires light, dark, and glass themes, while shared pagination was previously hardcoded in Vietnamese. The rebuild must establish localization at the shared-component layer. <!-- authority: llm-explicit -->

## Proposed Solution

Create Next.js App Router route groups, shared layouts, server-safe access helpers, client components only where browser state is required, vi/en message catalogs, theme tokens, and reusable portal-shell and data-table foundations. Route access remains delegated to TASK-REBUILD-002. <!-- authority: human-confirmed -->

## Alternatives Considered

Build each portal with an unrelated layout and component set. This is rejected because the handoff identifies shared layouts and components as common platform structure. <!-- authority: llm-explicit -->

Retain Nuxt middleware, Pinia, and server proxy routes. This is rejected because the operator selected the Next.js App Router as the single application boundary. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: the workspace has no shared portal web layer. Target: later portal tasks can use one shared layout, typed server-access, theme, and vi/en localization foundation. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: shared pagination text was a hardcoded-language issue. Target: new shared UI text resolves through the vi/en mechanism rather than a hardcoded Vietnamese string. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

The task creates shared Next.js web infrastructure only. It does not implement business pages, domain data contracts, or portal-specific workflows. <!-- authority: llm-explicit -->

### In scope

- Create shared App Router layouts, route groups, components, localization, theme, and typed server-access foundations. <!-- authority: llm-explicit -->
- Establish reusable portal shells, theme behavior, i18n, and data-table text handling. <!-- authority: human-confirmed -->
- Add source-selected checks for locale resolution and shared component behavior. <!-- authority: human-confirmed -->

### Out of scope

- Implement portal business features, data models, payments, or external integrations. <!-- authority: llm-explicit -->
- Bypass the identity and access controls from TASK-REBUILD-002. <!-- authority: llm-explicit -->
- Copy legacy source components or theme assets without explicit approval. <!-- authority: human-confirmed -->

## Dependencies

TASK-REBUILD-001 supplies the Next.js workspace and TASK-REBUILD-002 supplies session and role checks. This task supplies the reusable web layer for later portal tasks. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented shared-web intent into the approved Next.js direction. <!-- authority: human-confirmed -->
- Scope: The task does not invent page behavior, API contracts, visual assets, or localization copy not present in the source. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield authoring plan and later selected full-stack Next.js. <!-- authority: human-confirmed -->
