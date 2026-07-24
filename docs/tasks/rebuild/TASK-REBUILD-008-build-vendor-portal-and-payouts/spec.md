---
id: TASK-REBUILD-008
title: "Build vendor portal and payouts"
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
  - TASK-REBUILD-004
  - TASK-REBUILD-005
  - TASK-REBUILD-007
source_ref:
  - docs/03-portals.md:28-30
  - docs/04-roles-permissions.md:15-37
  - docs/05-data-model.md:30-36
  - docs/07-status-roadmap.md:20-25
provenance:
  - "source_path: docs/03-portals.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
---

# Task

## Summary

Build the greenfield vendor portal foundation beyond offer writes: vendor-scoped incoming order reads, admin-managed payout records with payout items linked to order items, vendor payout history, and a vendor dashboard summary derived from those existing records. <!-- authority: human-confirmed -->

## Problem

Approved vendors can already write offers and submit applications, and administrators can approve applications, but sellers still lack a signed-session view of their incoming orders and payout history. The source identifies vendor incoming orders as read-only, payouts history, marketplace `Payout`/`PayoutItem` settlement records as admin-managed, and vendor dashboard KPIs that must not remain mocked for the baseline facts already available from orders and payouts. <!-- authority: llm-explicit -->

## Proposed Solution

Add a SQLite vendor-commerce repository and signed-session route handlers in `app/web`. Vendors and administrators may list order rows that contain that vendor's offer line items without exposing unrelated sellers' lines or customer secrets. Administrators create payout records with an explicit USD amount and one or more payout items that reference that vendor's order items; vendors may only read their own payouts. A vendor dashboard summary exposes counts and paid-line USD totals derived from those scoped order and payout rows. Emit safe structured events for payout creation. <!-- authority: human-confirmed -->

## Alternatives Considered

Invent settlement eligibility, cadence, commission formulas, or automatic money transfer. This is rejected because the source records payouts as admin-managed and does not define a settlement formula; Task 7 already deferred that policy. <!-- authority: human-confirmed -->

Add order fulfillment transitions such as mark-shipped with tracking. This is deferred because the source identifies fulfillment actions but does not define the greenfield fulfillment-state contract, and Task 7 already excluded those transitions. <!-- authority: llm-explicit -->

Add report export or chart-series analytics beyond the summary facts above. This is deferred to later vendor analytics work once the baseline order and payout reads exist. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the greenfield application has no vendor-scoped order or payout history surface. Target: tests prove a vendor can read only their incoming order lines and payout history, an administrator can create an admin-managed payout for that vendor's order items, and a non-vendor cannot read another vendor's payouts. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: payout amounts and settlement rules are undefined beyond admin-managed records, and customer secrets must stay out of seller views. Target: tests prove payout creation requires an administrator-supplied USD amount, rejects foreign order items, creates no transfer or settlement formula, and omits customer email, session tokens, and payment secrets from vendor responses and events. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

This task establishes vendor-scoped order reads, admin-managed payout persistence, vendor payout history, and a summary dashboard derived from those records. It does not invent settlement policy, money movement, fulfillment transitions, report export, catalog import, or deployment. <!-- authority: llm-explicit -->

### In scope

- Vendor-scoped incoming order reads for line items tied to that vendor's offers, including administrator override reads. <!-- authority: human-confirmed -->
- Admin-managed `payouts` and `payout_items` persistence with an explicit USD amount and links to eligible order items. <!-- authority: human-confirmed -->
- Vendor payout history reads limited to the authenticated vendor (or administrator acting for a vendor). <!-- authority: human-confirmed -->
- Vendor dashboard summary totals derived from the vendor's order lines and payout records. <!-- authority: llm-explicit -->
- Safe structured events that exclude session tokens, email addresses, request bodies, and payment secrets. <!-- authority: llm-explicit -->

### Out of scope

- Settlement eligibility rules, commission formulas, cadence, bank transfer, tax, invoice, or ledger accounting. <!-- authority: human-confirmed -->
- Order fulfillment states, shipment tracking, returns, refunds, or customer-service actions. <!-- authority: llm-explicit -->
- Report CSV/PDF export, chart-series analytics beyond the summary totals, or legacy WordPress/Laravel/Nuxt recovery. <!-- authority: human-confirmed -->

## Dependencies

Task 4 provides vendor offers and ownership checks. Task 5 provides orders and paid USD line items. Task 7 provides vendor role assignment through the admin application queue. Later analytics or report-export tasks may extend the vendor dashboard after these baseline reads exist. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented vendor portal, marketplace payout records, and greenfield rebuild sequence into this task. <!-- authority: human-confirmed -->
- Scope: The task excludes undefined settlement formulas, money transfer, and fulfillment transitions. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue and session-wide routine acceptance gates. <!-- authority: human-confirmed -->
