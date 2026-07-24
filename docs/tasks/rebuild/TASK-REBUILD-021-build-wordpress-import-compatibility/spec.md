---
id: TASK-REBUILD-021
title: "Build WordPress import compatibility"
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
  - TASK-REBUILD-002
  - TASK-REBUILD-005
source_ref:
  - docs/01-vision.md:24-29
  - docs/02-architecture.md:71-80
  - docs/04-roles-permissions.md:66-72
  - docs/05-data-model.md:64-69
  - docs/07-status-roadmap.md:39-55
provenance:
  - "source_path: docs/07-status-roadmap.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
  - "import_decision: fixture-driven WordPress/WooCommerce-shaped import + PHPass verify compat in app/web; no live WP MySQL; no WordPress PHP runtime as product app"
  - "related_on_hold: docs/tasks/migration/TASK-MIGRATION-001-reconcile-wp-order-items (leave on_hold)"
  - "related_on_hold: docs/tasks/cutover/TASK-CUTOVER-001-define-b2c-parity (leave on_hold)"
  - "related_on_hold: docs/tasks/cutover/TASK-CUTOVER-002-execute-wordpress-cutover (leave on_hold)"
---

# Task

## Summary

Build greenfield WordPress import compatibility in `app/web`: a fixture-driven importer that maps WordPress/WooCommerce-shaped user and order payloads into Task 2 identity and Task 5 commerce stores, preserves legacy identifiers, matches orders by billing email plus total amount, verifies imported PHPass password hashes without reviving WordPress as the product runtime, and records dry-run or apply outcomes without connecting to a live WordPress MySQL. <!-- authority: human-confirmed -->

## Problem

The handoff documents a one-way WordPress → platform data flow (`WpImport`), WP-imported rows that carry legacy identifiers, order matching by `(billing_email→user_id, total_amount)`, and PHPass compatibility so imported accounts keep their passwords. The greenfield Next.js app has Task 2 scrypt auth and Task 5 orders, but no import adapter, no legacy-id columns, no PHPass verify path, and no documented order-match gate. <!-- authority: llm-explicit -->

The greenfield-only decision forbids implementing against unavailable legacy Laravel/`WpImport` source or treating WordPress as the product application. Non-rebuild `TASK-MIGRATION-001` (324 unmatched items) and cutover tasks stay on hold and must not be reopened. Connecting CI to a live WP MySQL or shipping a WordPress PHP runtime would violate greenfield constraints and invent production data access the sources do not authorize for this rebuild slice. <!-- authority: human-confirmed -->

## Proposed Solution

Add a `wordpress-import-core` module (or equivalent) in `app/web` that:

1. Defines a closed WordPress/WooCommerce-shaped fixture schema for users (email, PHPass hash, display name, legacy user id) and orders (billing email, total amount, line items, legacy order/item ids, currency). Fixtures are JSON documents checked into tests or generated in-memory — never a live MySQL dump requirement for CI. <!-- authority: human-confirmed -->
2. Imports users into the Task 2 auth store with preserved `legacy_wp_user_id` (or equivalent), storing the PHPass hash as the password credential for imported accounts. New greenfield accounts continue to use scrypt; imported PHPass hashes are accepted only when the stored hash matches the portable `$P$` / `$H$` PHPass form. <!-- authority: llm-explicit -->
3. Extends password verification so `login` accepts either scrypt (native) or PHPass (imported) hashes without inventing plaintext passwords or logging hash material. <!-- authority: human-confirmed -->
4. Imports orders into the Task 5 commerce store with preserved `legacy_wp_order_id` / `legacy_wp_order_item_id`, resolving the customer by normalized billing email → user id and matching on total amount as the documented gate. Unmatched orders MUST be recorded as `unmatched` outcomes without inventing slug-heuristic rematches. <!-- authority: llm-explicit -->
5. Supports `dry_run` and `apply` modes. Both append import-run / import-item outcome rows (accepted, skipped_duplicate, unmatched, rejected). `dry_run` MUST NOT mutate users or orders. `apply` MUST be idempotent on legacy ids (re-import of the same legacy id skips or no-ops). <!-- authority: human-confirmed -->
6. Exposes an admin-only import status/read and optional apply endpoint gated by Task 2 admin role, accepting fixture payloads in tests; default CI never opens a network socket or MySQL connection. <!-- authority: llm-explicit -->

Leave Task 2/5 ownership intact aside from the minimal schema and verifyPassword extensions required here. Leave `TASK-MIGRATION-001`, `TASK-CUTOVER-001`, `TASK-CUTOVER-002`, Vietnamese search, email/Zalo, and prior cores unchanged for ownership. Do not revive WordPress, Dokan, WooCommerce admin, or Laravel `WpImport` as the product app. <!-- authority: human-confirmed -->

## Alternatives Considered

Recover and run the unavailable Laravel `WpImport` command against live WordPress MySQL. This is rejected under the greenfield-only decision: legacy code is unavailable, and live revenue DB access is out of band for this rebuild slice. <!-- authority: human-confirmed -->

Embed a WordPress PHP runtime or WooCommerce admin inside `app/web` as a compatibility shim. This is rejected because the product app is the greenfield Next.js platform; import compatibility is a data adapter, not a hybrid frankenstein runtime. <!-- authority: human-confirmed -->

Reopen `TASK-MIGRATION-001` to reconcile the reported 324 unmatched items, or advance cutover tasks. This is rejected by standing orders to leave non-rebuild `on_hold` work alone; this task only builds the greenfield import/compat layer and records unmatched outcomes for later. <!-- authority: human-confirmed -->

Bulk-match unmatched orders by Vietnamese slug heuristics. This is rejected because migration doctrine forbids inventing matching rules without source evidence, and incorrect matches corrupt imported data. <!-- authority: llm-explicit -->

Require production WordPress credentials or CapRover `sachviet-current-db` connectivity before CI can pass. This is rejected because greenfield CI must stay credential-free and fixture-driven. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: greenfield has scrypt-only auth and commerce orders with no legacy ids, no PHPass verify, and no WP-shaped import path. Target: tests prove fixture users import with legacy ids and PHPass login success, fixture orders import when billing email + total match, dry_run mutates nothing, apply is idempotent on legacy ids, unmatched orders are recorded without slug heuristics, and admin-only status/apply refuses non-admin actors. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: greenfield-only forbids legacy runtime revival and live WP DB dependence; migration/cutover stay on hold. Target: tests/verify prove no WordPress PHP runtime, no MySQL client connection in the import core default path, no mutation of `TASK-MIGRATION-001` / cutover specs, and Task 2/5 native scrypt + checkout paths remain intact for non-imported accounts. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

This task establishes fixture-driven WordPress/WooCommerce import compatibility and PHPass verify support in the greenfield app. It does not reconnect live WordPress, reopen migration/cutover tasks, or invent unmatched-item reconciliation rules. <!-- authority: llm-explicit -->

### In scope

- Closed WP/Woo-shaped fixture schema for users and orders. <!-- authority: human-confirmed -->
- User import with `legacy_wp_user_id` and PHPass hash storage; login verify for `$P$`/`$H$` hashes. <!-- authority: human-confirmed -->
- Order import with legacy order/item ids, billing-email → user resolution, and total-amount match gate. <!-- authority: llm-explicit -->
- `dry_run` / `apply` modes with append-only import outcome records and idempotent re-import. <!-- authority: human-confirmed -->
- Admin-gated import status/apply API (or equivalent) for fixture payloads. <!-- authority: llm-explicit -->
- Core/route tests and a verify script proving fixture import, PHPass login, match/unmatched paths, dry_run safety, idempotency, and absence of WP runtime / MySQL client defaults. <!-- authority: llm-explicit -->

### Out of scope

- Live WordPress MySQL connectivity, CapRover `sachviet-current` / `sachviet-current-db` provisioning, or production re-import. <!-- authority: human-confirmed -->
- WordPress PHP runtime, WooCommerce/Dokan admin, Elementor, or Laravel `WpImport` command recovery. <!-- authority: human-confirmed -->
- Reopen or implement `TASK-MIGRATION-001`, `TASK-CUTOVER-001`, or `TASK-CUTOVER-002`. <!-- authority: human-confirmed -->
- Slug-heuristic rematching of unmatched order items, DNS cutover, or WordPress retirement. <!-- authority: llm-explicit -->
- Catalog media CDN migration, full WooCommerce product catalog dump import, or vendor Dokan payout history import beyond user/order fixtures needed for auth+order compatibility. <!-- authority: llm-explicit -->
- Mutate Vietnamese search, email/Zalo, notification/SSE, or publisher/author cores for ownership. <!-- authority: human-confirmed -->

## Dependencies

Task 2 provides signed sessions, roles, and the users table this task extends with legacy ids and PHPass verify. Task 5 provides the orders / order_items commerce store this task extends with legacy ids and imported paid/historical order rows. Later cutover/parity work may consume import outcomes but is out of scope here. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented WpImport / PHPass / legacy-identifier handoff and greenfield-only constraints into this rebuild task. <!-- authority: human-confirmed -->
- Scope: The task builds fixture-driven import compatibility and PHPass verify in `app/web`; it excludes live WordPress runtime revival, MySQL dependence, and on-hold migration/cutover work. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue, session-wide routine acceptance gates, and standing orders to leave non-rebuild on_hold tasks alone and to pause only for real decisions. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-021.*
