---
id: TASK-SEARCH-001
title: "Add Vietnamese fuzzy search with Meilisearch"
template: task@1
type: feature
module: search
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p2
created_at: "2026-07-23T05:51:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:26
  - docs/06-tech-stack.md:29-36
  - docs/06-tech-stack.md:43-49
  - docs/07-status-roadmap.md:12
  - docs/07-status-roadmap.md:34
  - docs/README.md:21-25
provenance:
  - "source_path: docs/06-tech-stack.md"
  - "source_hash: 8c41ac63bd47446666b3ea682a2ec4a704bc7c0968393a0ddab5c088026f49c4"
  - "source_refs: docs/03-portals.md:26; docs/06-tech-stack.md:29-36,43-49; docs/07-status-roadmap.md:12,34; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Prepare Vietnamese fuzzy search with Meilisearch only after a documented Vietnamese-diacritic search-quality complaint and an owner approval to index the public catalog. Until both conditions are recorded, make no Meilisearch service, index, or search-behavior change. <!-- authority: human-confirmed -->

## Problem

The storefront needs fuzzy search, and Meilisearch is planned, but the stack guidance says to make that change only when search-quality complaints in Vietnamese diacritics occur. <!-- authority: llm-explicit -->

The handoff identifies current search analytics and suggestions but does not define a complaint sample, relevance target, catalog fields, analyzer configuration, index lifecycle, hosting setup, or owner approval. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` locates the current public catalog search path and records a documented trigger, ask the owner to approve indexing the recovered public catalog. Only then define the smallest source-confirmed Meilisearch integration and verification set for Vietnamese-diacritic queries. <!-- authority: human-confirmed -->

If the trigger or approval is absent, record the condition as unmet and preserve the existing search behavior. Do not index accounts, orders, institutional data, vendor data, private content, or any field that is not source-confirmed public catalog data. <!-- authority: human-confirmed -->

## Alternatives Considered

Install Meilisearch before a search-quality complaint. This was rejected because the stack guidance explicitly makes the upgrade conditional on Vietnamese-diacritic quality complaints. <!-- authority: llm-explicit -->

Index all platform data to make later searches easier. This was rejected because the source only identifies a public storefront need and does not establish a safe index scope for private data. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: fuzzy search is planned, while the source gives Vietnamese-diacritic complaints as the trigger for Meilisearch. Target: a recorded trigger and owner approval govern any recovered public-catalog index and the source-selected Vietnamese-diacritic checks. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff does not define private-data indexing or a search service configuration. Target: source-selected checks show no Meilisearch service, index, or indexed field exists before both gates, and no non-public catalog data enters the work after approval. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is a trigger-gated public-catalog search change. It excludes implementation before the gates, private-data search, hosting changes, and an analyzer design that recovered source does not establish. <!-- authority: llm-explicit -->

### In scope

- Locate the current public catalog search path, current analytics or suggestions behavior, and source-confirmed public catalog fields. <!-- authority: llm-explicit -->
- Record a documented Vietnamese-diacritic search-quality trigger and obtain an owner approval before any indexing work begins. <!-- authority: human-confirmed -->
- After both gates, define and verify only the recovered public-catalog integration and Vietnamese-diacritic query cases. <!-- authority: human-confirmed -->
- Record any absent field, analyzer, complaint, or approval as a blocking evidence gap. <!-- authority: human-confirmed -->

### Out of scope

- Install or configure Meilisearch before the recorded trigger and owner approval. <!-- authority: human-confirmed -->
- Index private customer, order, vendor, institution, publishing, credential, or administrative data. <!-- authority: human-confirmed -->
- Deploy, add paid infrastructure, or alter production search behavior without separate operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the current search path, source-confirmed public catalog boundary, and available search evidence, or record each unavailable, before implementation starts. <!-- authority: human-confirmed -->

A documented Vietnamese-diacritic search-quality complaint and owner approval are execution gates, not assumed requirements. If either is missing, retain current search behavior and record the unmet condition. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a Vietnamese analyzer, index schema, search threshold, complaint, catalog field, infrastructure plan, or approval that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
