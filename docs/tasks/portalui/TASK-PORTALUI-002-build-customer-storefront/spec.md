---
id: TASK-PORTALUI-002
title: "Build the customer storefront experience"
template: task@1
type: feature
module: portalui
author: "@cursor"
department: engineering
status: done
priority: p0
created_at: "2026-07-25T02:51:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: true
depends_on:
  - TASK-PORTALUI-001
  - TASK-REBUILD-004
  - TASK-REBUILD-005
  - TASK-REBUILD-020
source_ref:
  - operator request: full customer portal experience
  - app/web/src/app/api/catalog
  - app/web/src/app/api/checkout/route.ts
  - app/web/src/app/api/orders/route.ts
---

# Task

## Summary

Deliver a bilingual, responsive customer storefront with catalog browsing, Vietnamese-aware search, product details, cart management, checkout hand-off, and authenticated order history using the existing catalog, commerce, and search APIs. <!-- authority: human-confirmed -->

## Problem

The platform has working domain cores and API routes but the storefront home is a placeholder and the cart is isolated from a complete discovery-to-order journey. Customers cannot evaluate books, build an order, or review prior purchases through the UI. <!-- authority: human-confirmed -->

## Customer Quotes

<untrusted_content source="operator request">"Continue implement, I want to complete full customer/admin portal experience."</untrusted_content>

## Proposed Solution

Create `/`, `/products/[slug]`, `/ecom/cart`, and `/ecom/orders` experiences composed from shared Thủy design primitives. Fetch and mutate only through existing API routes, preserve cart state in browser storage with validation, display money from minor units, surface inventory/offer availability, and hand checkout responses to their existing next action without recreating commerce rules in React. <!-- authority: llm-explicit -->

## Alternatives Considered

Render static sample books. Rejected because the operator requested a complete portal wired to existing APIs. <!-- authority: human-confirmed -->

Call domain cores directly from client components. Rejected because API routes already enforce the application boundary and business rules must not be duplicated in components. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - a customer can browse or search, open a product, add an available offer, review totals, submit checkout, and view order history through connected screens before this task reaches `done`. <!-- authority: human-confirmed -->

Guardrail - empty, loading, malformed-response, unauthorized, out-of-stock, and API-error states are visible and recoverable; cart quantities remain positive bounded integers and all displayed totals come from trusted API values or the shared commerce calculation contract. <!-- authority: llm-explicit -->

## Scope

This task owns the complete B2C customer journey while leaving payment settlement and operational order processing in their existing backend boundaries. <!-- authority: llm-explicit -->

### In scope

- Catalog cards, filters, pagination, suggestions, and vi/en search UI. <!-- authority: human-confirmed -->
- Product detail with metadata, offers, inventory state, and add-to-cart action. <!-- authority: human-confirmed -->
- Persistent cart, quantity edits, removal, summary, and checkout form/hand-off. <!-- authority: human-confirmed -->
- Authenticated customer order history with status and totals. <!-- authority: human-confirmed -->
- Tests for view-model normalization, cart transitions, API wiring, and failure states. <!-- authority: llm-explicit -->

### Out of scope

- New payment-provider behavior, refunds, returns, or retail fulfillment actions. <!-- authority: llm-explicit -->
- Production cutover or live WordPress parity work. <!-- authority: human-confirmed -->
- Royalty or earnings activation. <!-- authority: human-confirmed -->

## Dependencies

TASK-PORTALUI-001 supplies design and shared chrome. Rebuild tasks 004, 005, and 020 supply catalog, commerce, and Vietnamese search behavior. Authentication remains owned by the existing identity routes. <!-- authority: llm-explicit -->

## Sales/CS Summary

SachViet customers can now discover books in Vietnamese or English, inspect available editions, manage a cart, proceed through checkout, and return to see their orders in one consistent experience. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- **Tools used:** Cursor mapped existing catalog, checkout, order, and search route contracts and implemented the UI against them. <!-- authority: llm-explicit -->
- **Scope:** No AI feature or generated recommendation is introduced. <!-- authority: llm-explicit -->
- **Human review:** The operator requested the full customer portal and pre-approved routine acceptance gates for this run. <!-- authority: human-confirmed -->
