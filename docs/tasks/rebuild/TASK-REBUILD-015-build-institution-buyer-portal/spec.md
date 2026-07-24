---
id: TASK-REBUILD-015
title: "Build institution buyer portal"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
priority: p0
created_at: "2026-07-24T00:00:00+07:00"
shipped: "2026-07-24"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-004
  - TASK-REBUILD-013
  - TASK-REBUILD-014
source_ref:
  - docs/01-vision.md:16-18
  - docs/03-portals.md:48-50
  - docs/05-data-model.md:38-45
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/01-vision.md:16-18; docs/03-portals.md:48-50; docs/05-data-model.md:38-45"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
---

# Task

## Summary

Build the greenfield institution buyer portal capabilities in `app/web` on top of the existing blind quote and order reads: an informational organization budget, institution-initiated purchase-order submission against organization-owned `awaiting_po` B2B orders, and entitlement-gated private MARC delivery for titles on confirmed organization orders — without rewriting the B2B quote/order cores or disclosing upstream suppliers. <!-- authority: human-confirmed -->

## Problem

The `/institution` portal already has catalog, quotes, and selection lists, but its dashboard budget and approvals area is display-only. The portal docs call out the remaining needs: real budget tracking, PO submission, and MARC record delivery for purchased titles. The vision defines blind brokerage where institutions request quotes and order via PO, with MARC support for library cataloging. Tasks 13 and 14 deliberately deferred institution budget, institution-initiated PO submission, and MARC delivery. The greenfield app has organization-scoped blind quote/order reads and staff-attached contract/PO artifacts, but no institution buyer write path for budgets, PO submission, or MARC entitlement. <!-- authority: llm-explicit -->

## Proposed Solution

Add a SQLite institution-buyer module and signed-session route handlers in `app/web` that compose organization membership, catalog product ids, and existing B2B order records without rewriting `b2b-quote-core` or `b2b-order-core` ownership, status machines, or existing institution blind-read handlers. <!-- authority: human-confirmed -->

Persist one informational `institution_budgets` row per organization with a non-negative USD decimal string using the same money conventions as commerce, plus `updated_by` and `updated_at`. Allow `school_librarian` and `admin` actors to read the budget for the actor's organization (admin may read any organization when an organization id is supplied) and to upsert the informational amount. The budget MUST NOT reserve, charge, approve, reject, or otherwise change financial or order state. <!-- authority: human-confirmed -->

Allow `school_librarian` and `admin` actors to submit a purchase-order artifact against an organization-owned B2B order that is in `awaiting_po` status by supplying a staff-facing reference number and an opaque private storage key that is not a public URL. The submission MUST create a `purchase_order` artifact on that order using the existing artifact kinds and leave order status unchanged for staff confirmation. Institution responses after submission MUST return artifact reference numbers and omit storage keys, vendor ids, supplier identifiers, payout facts, and Stripe fields. Existing institution order/quote blind-read routes MUST remain behaviorally intact. <!-- authority: human-confirmed -->

Persist private `institution_marc_records` metadata keyed by `product_id` with an opaque storage key (not a public URL). Allow `employee_b2b` and `admin` actors to register or replace MARC metadata for a catalog product. Allow `school_librarian` and `admin` actors to list and read MARC metadata only for product ids that appear on at least one `confirmed` B2B order owned by the actor's organization. Institution MARC responses MUST omit storage keys from list payloads unless the detail read is entitlement-gated, and even then MUST NOT invent a new MARC serialization format, public download URL, email delivery, or third-party catalog push — return only the private metadata fields needed for an entitled private fetch (product id, opaque storage key, updated_at). Emit safe structured events that omit session tokens, email addresses, request bodies, payment secrets, and storage keys. <!-- authority: human-confirmed -->

## Alternatives Considered

Rewrite quote or order cores to own institution budgets and MARC tables. This is rejected because Tasks 13 and 14 already own those domains, and standing rebuild discipline requires leaving quote/order cores and institution blind reads intact while building the buyer portal on top. <!-- authority: human-confirmed -->

Treat the budget as a ledger that reserves, commits, or charges against PO submission. This is rejected because the sources say budget/PO tracking is not designed as a financial system, and the approved institution handoff limited budget to informational use. <!-- authority: human-confirmed -->

Auto-confirm a B2B order when the institution submits a PO. This is rejected because Task 14 already defines staff-gated confirmation after a purchase-order artifact exists; institution submission supplies the artifact, staff still confirm. <!-- authority: llm-explicit -->

Generate a new MARC download format, public URL, or third-party catalog delivery. This is rejected because the sources establish MARC as a library need and publisher upload concept, but do not establish a delivery serialization, public access, or external integration. <!-- authority: human-confirmed -->

Recover a legacy Laravel/Nuxt institution budget or MARC delivery implementation. This is rejected under the greenfield-only rebuild decision. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: institution budget is display-only, institutions cannot submit POs, and no entitlement-gated MARC delivery exists. Target: tests prove a `school_librarian` can upsert and read an informational organization budget; submit a purchase-order artifact against an organization-owned `awaiting_po` order without changing order status; and list/read private MARC metadata only for products on that organization's `confirmed` orders; unauthorized roles and cross-organization access fail. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: brokerage is blind; quote and order cores plus institution blind reads must stay intact; budget must not become a financial engine. Target: tests prove institution responses omit vendor/supplier identifiers and storage keys except the entitlement-gated MARC detail storage key; budget upsert does not mutate orders or quotes; PO submission does not confirm or cancel orders; `b2b-quote-core` and existing institution blind-read handlers are not rewritten for ownership; responses and structured events omit session tokens, email addresses, request bodies, payment secrets, and non-entitled storage keys. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

This task establishes greenfield institution buyer budget, PO submission, and entitlement-gated private MARC delivery under signed sessions on top of Tasks 4, 13, and 14. It does not invent financial ledgers, approval engines, MARC serializers, public document hosting, or deployment. <!-- authority: llm-explicit -->

### In scope

- Informational per-organization budget upsert and read for `school_librarian` / `admin`. <!-- authority: human-confirmed -->
- Institution-initiated `purchase_order` artifact submission against organization-owned `awaiting_po` B2B orders without changing order status. <!-- authority: human-confirmed -->
- Private product-keyed MARC metadata registration by `employee_b2b` / `admin`, and entitlement-gated institution list/detail for products on confirmed organization orders. <!-- authority: human-confirmed -->
- Preserve existing institution quote/order blind-read behavior and organization isolation. <!-- authority: human-confirmed -->
- Safe structured events that exclude session tokens, email addresses, request bodies, payment secrets, and non-entitled storage keys. <!-- authority: llm-explicit -->

### Out of scope

- Rewriting `b2b-quote-core`, `b2b-order-core` status machines, staff conversion/attach/transition APIs, or existing institution blind-read handlers. <!-- authority: human-confirmed -->
- Budget reservation, charging, reconciliation, auto-approve/reject, or any financial ledger. <!-- authority: human-confirmed -->
- Auto-confirming or cancelling B2B orders from institution PO submission. <!-- authority: llm-explicit -->
- New MARC serialization formats, public URLs, email/Zalo delivery, third-party catalog integrations, publisher royalty work, or deployment. <!-- authority: human-confirmed -->
- Legacy WordPress/Laravel/Nuxt recovery or changing non-rebuild `on_hold` tasks. <!-- authority: llm-explicit -->

## Dependencies

Task 4 provides catalog products that MARC metadata and purchased titles reference. Task 13 provides organizations, membership, selection lists, and institution quote reads that remain intact. Task 14 provides organization-owned B2B orders, `awaiting_po`/`confirmed` statuses, and `purchase_order` artifact kinds that institution PO submission and MARC entitlement compose. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented institution portal, B2B brokerage, and data-model sources into this greenfield rebuild task. <!-- authority: human-confirmed -->
- Scope: The task builds informational budgets, institution PO submission, and entitlement-gated private MARC delivery and excludes financial ledgers, auto-confirmation, MARC serializers, public hosting, quote/order core rewrites, and legacy recovery. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue and session-wide routine acceptance gates. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-015.*
