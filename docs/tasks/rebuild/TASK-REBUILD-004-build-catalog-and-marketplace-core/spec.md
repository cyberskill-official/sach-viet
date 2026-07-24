---
id: TASK-REBUILD-004
title: "Build catalog and marketplace core"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
priority: p0
created_at: "2026-07-24T00:00:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-001
  - TASK-REBUILD-002
  - TASK-REBUILD-003
source_ref:
  - docs/01-vision.md:13-15
  - docs/03-portals.md:9-26
  - docs/05-data-model.md:5-29
provenance:
  - "source_path: docs/01-vision.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield full-stack Next.js rebuild on 2026-07-24"
---

# Task

## Summary

Build the greenfield catalog and multi-vendor marketplace core in the Next.js application: categories, products, media, variants, vendor offers, and a deterministic buy-box selection. Product records must remain distinct from vendor price and inventory records. <!-- authority: human-confirmed -->

## Problem

SachViet is a multi-vendor marketplace where one book can have many seller offers. The source places price and stock on `product_vendors`, not products, and requires the winning offer to drive the displayed buy-box data. The new application has no catalog domain implementation. <!-- authority: llm-explicit -->

## Proposed Solution

Add a SQLite catalog schema and server-side repository inside `app/web`, then expose protected vendor write paths and public read paths through the shared portal foundation. Use a deterministic primary-offer rule that selects only active, in-stock offers and keeps catalog facts separate from offer facts. <!-- authority: human-confirmed -->

## Alternatives Considered

Store price and stock directly on products. This is rejected because the source explicitly assigns them to vendor offers. <!-- authority: llm-explicit -->

Copy WordPress catalog data or add a migration job. This is rejected because the approved scope is a greenfield rebuild and legacy movement requires a separate task. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: the new application has no catalog or marketplace domain. Target: tests prove one product can expose several vendor offers while only an eligible primary offer supplies buy-box information. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the source prohibits placing offer price and stock on products. Target: tests reject product-level pricing and prevent inactive or out-of-stock offers from winning the buy box. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

The task establishes the catalog and marketplace core only. It does not implement cart, checkout, payments, order fulfillment, catalog import, search infrastructure, or vendor analytics. <!-- authority: llm-explicit -->

### In scope

- Implement categories, products, product media, variants, vendor offers, and a category-level primary-offer rule. <!-- authority: llm-explicit -->
- Create public catalog reads and vendor-authorized offer writes using Task 2 server authorization. <!-- authority: human-confirmed -->
- Add checks for multi-vendor pricing, stock eligibility, ownership, and deterministic selection. <!-- authority: human-confirmed -->

### Out of scope

- Put price, list price, or stock on product records. <!-- authority: llm-explicit -->
- Add checkout, payments, legacy migration, media CDN integration, fuzzy search, or supplier disclosure. <!-- authority: human-confirmed -->

## Dependencies

The Next.js workspace, identity foundation, and shared portal layer are complete in Tasks 1 through 3. Later storefront, vendor, B2B, and publishing tasks use this catalog core. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the approved source model into the greenfield rebuild sequence. <!-- authority: human-confirmed -->
- Scope: The task does not invent pricing ownership, payment contracts, import access, or supplier disclosure behavior. <!-- authority: llm-explicit -->
- Human review: The operator approved a full-stack Next.js rebuild and session-wide routine approvals. <!-- authority: human-confirmed -->
