---
id: TASK-B2B-001
title: "Add B2B quote-kanban click-through"
template: task@1
type: feature
module: b2b
author: "@codex"
department: engineering
status: closed
entered_via: audit
priority: p1
created_at: "2026-07-23T04:10:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:44-46
  - docs/07-status-roadmap.md:47
  - docs/05-data-model.md:38-45
  - docs/README.md:21-25
provenance:
  - "closed_as_superseded: TASK-REBUILD-013 on 2026-07-24 (operator session judgment; see docs/tasks/rebuild/.workflow/on-hold-supersession-2026-07-24.md)"
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:44-46; docs/07-status-roadmap.md:47; docs/05-data-model.md:38-45; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Add source-derived click-through behavior for each current B2B quote-pipeline card after discovery identifies the existing quote-management destination, route, identifier, payload, and authorization contract. Preserve the current pipeline and quote behavior. <!-- authority: human-confirmed -->

## Problem

The B2B staff portal has a real `quotes_pipeline` kanban and quote management, but its pipeline cards have no click-through routes. The quote model documents draft, sent, negotiating, won, and lost lifecycle states. <!-- authority: llm-explicit -->

The available repository does not contain the application source needed to identify a card component, quote destination, route name, identifier, payload, or authorization rule. Those details must come from discovery instead of assumption. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies current B2B paths and quote behavior, wire each current pipeline card to its source-confirmed quote-management context. Use the existing destination and authorization contract, and add source-selected verification that preserves the current real pipeline data and quote behavior. <!-- authority: human-confirmed -->

If recovered source shows more than one valid destination or no route contract, record the evidence gap and request a product decision before adding navigation. Do not create a new detail route, card action, or lifecycle transition from this task. <!-- authority: human-confirmed -->

## Alternatives Considered

Fold quote-to-order conversion into card navigation. This was rejected because conversion is listed as not started and is separate work from navigation. <!-- authority: llm-explicit -->

Create a new quote detail route without tracing current quote management. This was rejected because the existing destination and authorization contract are not present in the handoff repository. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: current B2B pipeline cards have no click-through routes. Target: each current pipeline card has a source-derived click-through path to its current quote context without changing documented pipeline or quote behavior. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff establishes real pipeline data and quote management but not a route contract. Target: the implementation uses only a source-confirmed destination, identifier, payload, and authorization path, or records a bounded evidence gap for an owner decision. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope adds navigation to an existing source-confirmed quote context and keeps conversion, contracts, purchase-order work, and lifecycle changes outside this task. <!-- authority: llm-explicit -->

### In scope

- Locate the current pipeline-card component, quote-management destination, identifier, and authorization boundary from the discovery output. <!-- authority: llm-explicit -->
- Add source-confirmed card navigation to the existing quote context. <!-- authority: human-confirmed -->
- Verify that current pipeline data and source-confirmed quote behavior remain intact. <!-- authority: human-confirmed -->
- Record an evidence gap and request a product decision if discovery establishes multiple valid destinations or no route contract. <!-- authority: human-confirmed -->

### Out of scope

- Implement quote-to-order conversion, contracts, purchase-order artifacts, or a new quote lifecycle transition. <!-- authority: llm-explicit -->
- Create a new quote detail route, payload, or role policy without source evidence. <!-- authority: llm-explicit -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the application path, current B2B route and authorization contract, or record each unavailable, before implementation starts. This is a discovery result rather than a dependency on an unnamed team. <!-- authority: human-confirmed -->

The handoff constraints against local application execution, public repositories, and committed secrets remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a quote route, detail destination, identifier, payload, role policy, card action, or lifecycle transition that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
