---
id: TASK-REBUILD-005
title: "Build storefront cart and checkout"
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
source_ref:
  - docs/01-vision.md:13-15
  - docs/03-portals.md:9-26
  - docs/05-data-model.md:17-29
provenance:
  - "source_path: docs/01-vision.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: Stripe hosted Checkout test-mode default on 2026-07-24"
---

# Task

## Summary

Build the greenfield customer cart, checkout, order, and order-history core in the Next.js application. Use Stripe hosted Checkout in test mode as the approved default. Keep provider credentials out of the repository. <!-- authority: human-confirmed -->

## Problem

The catalog core can show a buy box but cannot retain a customer selection, create an order, or start a hosted payment checkout. The source requires cart add-ons, hosted checkout, and customer order history. <!-- authority: llm-explicit -->

## Proposed Solution

Add a client-side cart model with local persistence, server-side checkout and order records, Stripe Checkout session creation behind environment variables, and signed webhook processing that updates order payment state. Store the selected vendor offer on each order item so the order preserves the accepted commercial facts. <!-- authority: human-confirmed -->

## Alternatives Considered

Build an in-app card form. This is rejected because the source specifies hosted checkout. <!-- authority: human-confirmed -->

Ship Stripe and PayPal together. This is deferred because the operator authorized the recommended Stripe-only default for this rebuild task. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: no customer cart or checkout exists in the new application. Target: tests prove a catalog offer can become a persisted order item only after the server revalidates its eligible price and stock. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: payment credentials and raw card data must never enter the application repository or database. Target: tests prove checkout requires environment configuration, uses a hosted redirect URL, and rejects invalid webhook signatures. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The task establishes the B2C storefront cart and Stripe hosted-checkout path. It does not add PayPal, live credentials, tax or shipping integrations, refunds, fulfillment, discount campaigns, legacy import, or deployment. <!-- authority: llm-explicit -->

### In scope

- Add a client-side cart with product offer, quantity, plastic-cover, and gift-wrap selections. <!-- authority: human-confirmed -->
- Create server-side orders and order items that record the selected vendor offer and checkout state. <!-- authority: llm-explicit -->
- Create a Stripe hosted-checkout session from server-validated order data and process a signed checkout-completion webhook. <!-- authority: human-confirmed -->
- Provide customer-authorized order-history reads. <!-- authority: llm-explicit -->

### Out of scope

- Store payment card data, payment-provider secrets, or live checkout credentials. <!-- authority: human-confirmed -->
- Add PayPal, tax, shipping rates, refunds, vendor payouts, fulfillment actions, promotions, or legacy data import. <!-- authority: llm-explicit -->

## Dependencies

Task 4 provides catalog products, vendor offers, primary-offer selection, and the commercial facts this task must revalidate. The existing identity foundation provides customer sessions. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex converted the approved source flow and Stripe-only default into a greenfield task. <!-- authority: human-confirmed -->
- Scope: The task does not invent live payment access, tax rules, shipping rules, or refund behavior. <!-- authority: llm-explicit -->
- Human review: The operator approved recommended defaults and routine acceptance gates for this session. <!-- authority: human-confirmed -->
