---
id: TASK-ADMIN-002
title: "Add admin catalog write APIs and thin dashboard UI"
template: task@1
type: feature
module: admin
author: "@cursor"
department: engineering
status: done
priority: p0
created_at: "2026-07-27T05:50:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-004
  - TASK-REBUILD-007
  - TASK-PORTALUI-003
source_ref:
  - operator plan: day-2 admin catalog writes
  - app/web/src/lib/catalog-core.mjs
  - app/web/src/lib/admin-commerce-core.mjs
  - app/web/src/components/admin-dashboard.tsx
  - app/web/OPERATIONS.md
  - docs/ops/production-execute-status-2026-07-26.md
---

# Task

## Summary

Expose admin-only HTTP APIs and a thin `/admin` catalog section that wrap existing `catalog-core` writers so Day-2 Production catalog load can create categories, products (with optional media/variant), and vendor offers without WordPress import or `seed:local`. <!-- authority: human-confirmed -->

## Problem

Production health is green and the public catalog is empty. Ops docs recommend admin day-2 entry for the first Production catalog, but admin surfaces today only cover dashboard, vendor applications, payouts, and WordPress import status. Catalog writes already exist in `catalog-core.mjs` (`createCategory`, `createProduct`, `addProductMedia`, `createProductVariant`, `writeVendorOffer`) with no admin HTTP or UI wrapper. Public catalog routes are read-only; `POST /api/vendor/offers` requires an existing product. <!-- authority: human-confirmed -->

## Proposed Solution

Add admin-gated routes under `/api/admin/catalog/` that authenticate via the existing session cookie pattern, require `admin` (via the same administrator check used by admin commerce), and call `catalog-core` writers/readers. Extend `admin-dashboard.tsx` with a thin catalog section: list current categories/products summary and create category → product (optional media/variant) → offer. Day-2 first-party offers MAY use the logged-in admin user id as `vendorId` (or an explicit platform vendor id field); `vendor_offers.vendor_id` is unconstrained TEXT and admins already pass `canAccessOwnedRecord` for any vendor id. Update `OPERATIONS.md` Production catalog options so option 1 is admin day-2 and WordPress fixture is not the recommended path. <!-- authority: human-confirmed -->

## Alternatives Considered

Run `seed:local` against Supabase Production. Rejected — standing Production rule forbids it. <!-- authority: human-confirmed -->

Load via WordPress fixture import. Rejected for Day-2 default — WP stays N/A / not recommended; admin commerce path is the documented day-2 option. <!-- authority: human-confirmed -->

Build a full vendor portal offer UI first. Rejected as out of scope for minimal Day-2 unblock. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: Production catalog empty and no admin write surface. Target: an authorized admin can create ≥1 category, ≥1 product (with variant when checkout requires it), and ≥1 active in-stock offer through the new APIs/UI, and public `GET /api/catalog/products` reflects the product after deploy. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: non-admin callers are refused on admin commerce routes; catalog-core keeps price/stock on offers. Target: non-admin callers receive 401/403; product create refuses offer fields; no WordPress, Stripe, or Phase B/C unlock; no `seed:local` against Production. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

This task owns the minimal admin catalog write path for Day-2. It does not unlock payments, WordPress cutover, or bulk import. <!-- authority: human-confirmed -->

### In scope

- `GET/POST /api/admin/catalog/categories` wrapping category list/create. <!-- authority: human-confirmed -->
- `GET/POST /api/admin/catalog/products` wrapping product list/create; product create MAY accept optional media and/or variant payloads (or sibling POSTs under the same admin catalog namespace). <!-- authority: human-confirmed -->
- `POST /api/admin/catalog/offers` wrapping `writeVendorOffer` for an admin actor. <!-- authority: human-confirmed -->
- Thin catalog section on `admin-dashboard.tsx`: create category → product → offer; show a short current-catalog summary. <!-- authority: human-confirmed -->
- Focused verify script and/or tests asserting admin gate + catalog-core reuse. <!-- authority: llm-explicit -->
- `OPERATIONS.md` Production catalog options: admin day-2 first; WP fixture not recommended; `seed:local` still forbidden on Production. <!-- authority: human-confirmed -->

### Out of scope

- Bulk import, WordPress import apply, live WP MySQL migration. <!-- authority: human-confirmed -->
- Stripe, Phase B/C unlock, vendor portal offer UI redesign. <!-- authority: human-confirmed -->
- Running `seed:local` against Production, inventing admin credentials, or Production deploy/push/merge without operator instruction. <!-- authority: human-confirmed -->

## Dependencies

`TASK-REBUILD-004` supplies catalog-core writers and the product/offer split. `TASK-REBUILD-007` supplies admin-only commerce patterns. `TASK-PORTALUI-003` supplies the admin dashboard shell to extend. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- **Tools used:** Cursor authored this task from the approved Day-2 admin catalog plan and existing catalog/admin sources. <!-- authority: llm-explicit -->
- **Scope:** No AI decision support, automated catalog generation, or credential invention is introduced. <!-- authority: llm-explicit -->
- **Human review:** Operator approved the Day-2 plan; HITL remains required at reviewing→ready_to_test and testing→done. <!-- authority: human-confirmed -->
