---
id: TASK-REBUILD-014
title: "Build B2B order, contract, and PO flow"
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
  - TASK-REBUILD-005
  - TASK-REBUILD-013
source_ref:
  - docs/01-vision.md:16-18
  - docs/03-portals.md:44-46
  - docs/07-status-roadmap.md:29-37
provenance:
  - "source_path: docs/01-vision.md"
  - "source_hash: 85bd3a7365b7c6ed3eb5dc449e867b08316b23fb2b055db69a0d5ecb8f0cac23"
  - "source_refs: docs/01-vision.md:16-18; docs/03-portals.md:44-46; docs/07-status-roadmap.md:29-37"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
---

# Task

## Summary

Build the greenfield B2B quote → order conversion and private contract/purchase-order artifact association in `app/web`, on top of the existing won-quote pipeline and commerce money conventions, while keeping brokerage blind and leaving the quote-pipeline module intact. <!-- authority: human-confirmed -->

## Problem

The vision describes PO-based institutional ordering after B2B staff quote and negotiate. The `/b2b` portal still needs quote → order conversion and contract/PO artifacts after the quote pipeline ships. The roadmap lists quote → order conversion as the next phase. Task 13 deliberately excluded order creation, contracts, and POs. The greenfield app has won quotes and B2C commerce orders, but no institutional order or artifact domain. <!-- authority: llm-explicit -->

## Proposed Solution

Add a SQLite B2B order repository and signed-session route handlers in `app/web` that consume Task 13 quote records without rewriting the quote-pipeline module. Persist `b2b_orders` linked one-to-one to a `won` quote, copying organization ownership and quote line items into `b2b_order_items` with required non-negative USD unit prices using the same money conventions as commerce checkout. Persist private `b2b_artifacts` rows of kind `contract` or `purchase_order` with a staff-supplied reference number and an opaque private storage key — not a public URL. <!-- authority: human-confirmed -->

Allow `employee_b2b` and `admin` actors to convert only a `won` quote into an order when every quote line has a unit price, attach contract/PO artifacts to that order, list and read staff order detail, and advance order status only along the closed transitions `awaiting_po→confirmed` (only when at least one `purchase_order` artifact exists) and `awaiting_po→cancelled`. Allow `school_librarian` and `admin` actors to list and read organization-owned orders and artifact reference numbers without receiving storage keys, vendor ids, supplier identifiers, payout facts, or Stripe checkout fields. Do not create B2C cart/checkout orders from quotes, do not call Stripe, and do not mutate quote status transitions or quote schema ownership in `b2b-quote-core`. Emit safe structured events that omit session tokens, email addresses, request bodies, payment secrets, and storage keys. <!-- authority: human-confirmed -->

## Alternatives Considered

Reuse B2C `orders` / Stripe hosted checkout for institutional conversion. This is rejected because the source describes PO-based brokerage ordering, not card checkout, and B2C order items require vendor offers that would break blindness. <!-- authority: human-confirmed -->

Let institution buyers submit POs, track budgets, or receive MARC files in this task. This is deferred to the institution buyer portal work (Task 15). <!-- authority: llm-explicit -->

Build public document URLs, e-signature, templates, OCR, legal retention, or a new file-storage service. This is rejected because the source does not define those systems; this task only associates private artifact metadata. <!-- authority: human-confirmed -->

Recover a legacy Laravel/Nuxt contract/PO implementation. This is rejected under the greenfield-only rebuild decision. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: won quotes cannot become institutional orders and no contract/PO artifact records exist. Target: tests prove B2B staff can convert a priced `won` quote into an `awaiting_po` order once, attach `contract` and `purchase_order` artifacts, confirm only after a PO artifact exists, and cancel from `awaiting_po`; institution members can read organization-owned orders and artifact reference numbers; unauthorized roles cannot. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: brokerage is blind; quote pipeline ownership stays in Task 13; B2C Stripe checkout must not absorb institutional conversion. Target: tests prove institution order responses omit vendor/supplier identifiers and storage keys; conversion refuses non-`won` quotes, unpriced lines, and duplicate conversion; `b2b-quote-core` is not rewritten to own order/contract/PO tables; responses and structured events omit session tokens, email addresses, request bodies, payment secrets, and storage keys. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

This task establishes greenfield quote → B2B order conversion and private contract/PO artifact association under signed sessions. It does not invent institution PO submission UX, budgets, MARC delivery, public document hosting, or deployment. <!-- authority: llm-explicit -->

### In scope

- Convert a priced `won` quote into a `b2b_orders` record with copied line items and USD money conventions from commerce. <!-- authority: human-confirmed -->
- Enforce one order per quote and refuse conversion when any line lacks a unit price. <!-- authority: human-confirmed -->
- Persist private contract and purchase-order artifact metadata (kind, reference number, opaque storage key) on a B2B order. <!-- authority: human-confirmed -->
- Closed order statuses `awaiting_po`, `confirmed`, and `cancelled` with transitions `awaiting_po→confirmed` (PO artifact required) and `awaiting_po→cancelled`. <!-- authority: human-confirmed -->
- Staff list/read/convert/attach/transition surfaces for `employee_b2b` / `admin`. <!-- authority: human-confirmed -->
- Institution list/read of organization-owned orders and artifact reference numbers without supplier disclosure or storage keys for `school_librarian` / `admin`. <!-- authority: human-confirmed -->
- Safe structured events that exclude session tokens, email addresses, request bodies, payment secrets, and storage keys. <!-- authority: llm-explicit -->

### Out of scope

- Rewriting or replacing the Task 13 quote pipeline, status machine, selection lists, or organizations module. <!-- authority: human-confirmed -->
- Creating B2C cart orders, Stripe checkout sessions, vendor-offer-backed retail line items, or payout records from quotes. <!-- authority: human-confirmed -->
- Institution budget tracking, institution-initiated PO submission UX, MARC delivery, or publisher/author earnings. <!-- authority: llm-explicit -->
- Public artifact URLs, e-signature, templates, OCR, conversion pipelines, legal terms, retention policy, or a new file-storage service. <!-- authority: human-confirmed -->
- Legacy WordPress/Laravel/Nuxt recovery, live notification changes, email/Zalo, or deployment. <!-- authority: llm-explicit -->

## Dependencies

Task 5 provides commerce money conventions and the B2C order patterns this task must not overload for PO-based brokerage. Task 13 provides organizations, membership, won quotes, priced quote line items, and the intact quote pipeline this conversion reads. Later Task 15 may deepen institution buyer PO submission, budgets, and MARC delivery on top of these orders. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented B2B brokerage, portal, and roadmap sources into this greenfield rebuild task. <!-- authority: human-confirmed -->
- Scope: The task builds quote → order conversion and private contract/PO artifact association and excludes institution PO submission UX, budgets, MARC delivery, public document hosting, Stripe institutional checkout, and quote-pipeline rewrites. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue and session-wide routine acceptance gates. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-014.*
