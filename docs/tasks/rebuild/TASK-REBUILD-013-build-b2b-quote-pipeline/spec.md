---
id: TASK-REBUILD-013
title: "Build B2B quote pipeline"
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
  - TASK-REBUILD-002
  - TASK-REBUILD-003
  - TASK-REBUILD-004
source_ref:
  - docs/01-vision.md:16-18
  - docs/03-portals.md:44-46
  - docs/05-data-model.md:38-45
provenance:
  - "source_path: docs/01-vision.md"
  - "source_hash: 85bd3a7365b7c6ed3eb5dc449e867b08316b23fb2b055db69a0d5ecb8f0cac23"
  - "source_refs: docs/01-vision.md:16-18; docs/03-portals.md:44-46; docs/05-data-model.md:38-45"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
---

# Task

## Summary

Build the greenfield B2B quote pipeline in `app/web`: organizations, institution selection lists, `B2bQuote` records with the documented draft → sent → negotiating → won/lost lifecycle, staff pipeline reads with quote click-through, and institution-owned quote reads under signed sessions — without disclosing upstream suppliers (blind brokerage). <!-- authority: human-confirmed -->

## Problem

The vision describes blind institutional brokerage: institutions build selection lists, request quotes, and B2B staff quote and negotiate before PO-based ordering. The data model names `Organization`, `SelectionList` / `SelectionListItem`, and `B2bQuote` with pipeline states draft → sent → negotiating → won/lost. The `/b2b` portal needs a quote pipeline with click-through to quote management; quote → order conversion and contract/PO artifacts are later work. The greenfield application has identity, portals, and catalog, but no B2B quote domain. <!-- authority: llm-explicit -->

## Proposed Solution

Add a SQLite B2B quote repository and signed-session route handlers in `app/web`. Persist organizations and membership links so `school_librarian` actors belong to an institution. Persist selection lists and list items that reference catalog products. Persist `b2b_quotes` with the closed status set `draft`, `sent`, `negotiating`, `won`, and `lost`, plus quote line items that reference products and optional negotiated unit prices as non-negative USD decimal strings matching existing commerce money conventions. <!-- authority: human-confirmed -->

Allow `school_librarian` (and `admin`) actors to create and list selection lists for their organization, request a quote from a selection list (creating a `draft` quote), and read quotes owned by their organization. Allow `employee_b2b` and `admin` actors to list the pipeline grouped by status, read any quote detail (click-through target), and advance quote status only along the closed transitions `draft→sent`, `sent→negotiating`, `negotiating→won`, and `negotiating→lost`. Institution-facing quote reads and responses MUST omit vendor ids, supplier identifiers, payout facts, and other upstream seller disclosure so the brokerage stays blind. Emit safe structured events that omit session tokens, email addresses, request bodies, and payment secrets. <!-- authority: human-confirmed -->

## Alternatives Considered

Implement quote → order conversion, contracts, or purchase-order artifacts now. This is deferred because the source and rebuild sequence reserve those for Task 14. <!-- authority: human-confirmed -->

Build institution budget tracking, PO submission, or MARC delivery inside this task. This is deferred because those belong to the institution buyer portal work (Task 15) and are not defined as quote-pipeline scope. <!-- authority: llm-explicit -->

Disclose product vendor offers or supplier identity on institution quote views. This is rejected because the source defines B2B brokerage as blind. <!-- authority: human-confirmed -->

Recover a legacy Laravel/Nuxt `quotes_pipeline` implementation. This is rejected under the greenfield-only rebuild decision. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: the greenfield application has no organizations, selection lists, B2B quotes, or staff pipeline. Target: tests prove an institution buyer can create a selection list, request a draft quote, and read organization-owned quotes; a B2B staff actor can list the pipeline by status, open quote detail, and advance status only on the closed transitions; unauthorized roles cannot. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: brokerage is blind and order/contract conversion is later work. Target: tests prove institution quote responses omit vendor/supplier identifiers, the implementation creates no order, contract, or PO records, and responses and structured events omit session tokens, email addresses, request bodies, and payment secrets. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

This task establishes the greenfield quote pipeline, selection lists, organizations, and role-gated reads/writes under signed sessions. It does not invent order conversion, contracts, POs, budgets, MARC delivery, or deployment. <!-- authority: llm-explicit -->

### In scope

- Organizations and membership links for institutional buyers. <!-- authority: human-confirmed -->
- Selection lists and product-backed list items. <!-- authority: human-confirmed -->
- `B2bQuote` persistence with closed statuses draft, sent, negotiating, won, and lost, plus product line items and optional negotiated USD unit prices. <!-- authority: human-confirmed -->
- Institution create/list selection lists, request quote from a list, and read organization-owned quotes without supplier disclosure. <!-- authority: human-confirmed -->
- B2B staff pipeline list grouped by status, quote detail click-through, and closed status transitions. <!-- authority: human-confirmed -->
- Signed-session authorization for `school_librarian` / `admin` on institution surfaces and `employee_b2b` / `admin` on staff surfaces. <!-- authority: human-confirmed -->
- Safe structured events that exclude session tokens, email addresses, request bodies, and payment secrets. <!-- authority: llm-explicit -->

### Out of scope

- Quote → order conversion, commerce order creation from a won quote, contracts, or purchase-order artifacts. <!-- authority: human-confirmed -->
- Institution budget tracking, PO submission UX, MARC record delivery, or publisher/author earnings. <!-- authority: llm-explicit -->
- Disclosing vendor offers, supplier identities, or payout facts to institution buyers. <!-- authority: human-confirmed -->
- Legacy WordPress/Laravel/Nuxt recovery, live notification changes, email/Zalo, or deployment. <!-- authority: llm-explicit -->

## Dependencies

Task 2 provides signed sessions and role normalization, including `school_librarian`, `employee_b2b`, and portal ACL maps for `/institution` and `/b2b`. Task 3 provides shared portal foundations. Task 4 provides catalog products that selection-list and quote line items reference. Later Task 14 may convert won quotes into orders and attach contract/PO artifacts. Later Task 15 may deepen the institution buyer portal with budget and PO submission. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented B2B brokerage, portal, and data-model sources into this greenfield rebuild task. <!-- authority: human-confirmed -->
- Scope: The task builds the quote pipeline and selection-list core and excludes order conversion, contracts, POs, budgets, MARC delivery, and supplier disclosure. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue and session-wide routine acceptance gates. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-013.*
