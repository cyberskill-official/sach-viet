---
id: TASK-UI-002
title: "Customer account, support assignment, vendor offer editor, fulfillment overlay"
template: task@1
type: feature
module: portalui
author: "@cursor"
department: engineering
status: done
entered_via: golive_wave
priority: p1
created_at: "2026-08-13T05:08:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-UI-001
  - TASK-COM-001
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-full-production-completion-plan.md#PKG-70
  - docs/plans/sachviet-full-production-completion-plan.md#FL-ID-07
  - docs/plans/sachviet-full-production-completion-plan.md#FL-VEN-03
provenance:
  - "source_path: docs/plans/sachviet-full-production-completion-plan.md"
  - "source_path: /Users/stephencheng/.cursor/plans/local-complete_golive_wave_1b3ef2a9.plan.md"
  - "operator_resolution: local-complete golive wave 0 2026-08-13"
---

# Task

## Summary

Deepen existing APIs into walkable pages: customer account + stored-but-unused addresses + order timeline; support assignment; vendor offer create/edit; packing/shipped/delivered as operational notes only. Extend local seed; refuse `NODE_ENV=production` and non-loopback/`db` `DATABASE_URL`. No new finance math. <!-- authority: llm-explicit -->

## Problem

TASK-UI-001 wires portals to existing APIs. The golive wave still needs a local nine-portal walkthrough: customer account (`FL-ID-07`), support assignment, vendor offer editor (`FL-VEN-03`), and a minimal fulfillment overlay. Legal shipping contracts, tax, commissions, and royalties stay unsigned. Publisher/author finance stays the existing policy notice. <!-- authority: llm-explicit -->

## Proposed Solution

Reuse existing cores: `support-core.mjs`, `vendor-commerce-core.mjs`, `catalog-core.mjs`, `employee-retail-core.mjs`, `b2b-quote-core.mjs`, `storage-core.mjs`, `publisher-portal-core.mjs`, `admin-dashboard.tsx`. Customer: email, password change, locale; addresses stored but unused in quote; order timeline. Vendor: offer create/edit; incoming lines; mark `packing | shipped | delivered` on own lines (status column or side table) as operational notes, not legal shipping. Admin: split catalog / applications / payouts / flags; failed panels must error, not show zero. Employee/retail: `assignee_id` on tickets; paid-order list + fulfillment overlay. B2B/institution: pipeline, quote detail, convert, PO upload via `stored_objects`. Publisher/author: requests/withdraw/MARC only. Extend `seed-local-core.mjs` so `npm run seed:local` against Compose Postgres walks every current role; already refuses `NODE_ENV=production`; fingerprint must also refuse if `DATABASE_URL` host is not loopback/`db`. <!-- authority: llm-explicit -->

Routes and authz: existing portal matchers; customer account/settings; vendor offer write stays vendor/admin; support assignment is employee/admin; vendor cannot write another vendor's offers. <!-- authority: llm-explicit -->

## Alternatives Considered

Invent tax, shipping rates, or treat packing/shipped/delivered as a legal carrier contract. Rejected — DEC-COM-001 / DEC-RET-001 unsigned; overlay is operational notes only. <!-- authority: llm-explicit -->

Build publisher/author finance ledgers. Rejected — DEC-ROY-001 / DEC-SET-001; keep the policy notice. <!-- authority: llm-explicit -->

Reopen TASK-REBUILD-001…023. Rejected — those stay done. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: portals exist but account, assignment, offer editor, and fulfillment overlay are incomplete. Target: each named portal action works against real APIs locally; seed walks current roles; failed admin panels error not zero; `npm test` covers named cores. Deadline: before reviewing → ready_to_test. <!-- authority: llm-explicit -->

Guardrail - baseline: Production may already be live. Target: no Production deploy, merge, or `seed:local` against Production; no `sk_live_` / `PAYPAL_MODE=live`; no invented finance numbers. Deadline: ongoing. <!-- authority: llm-explicit -->

## Scope

### In scope

- Customer account (email, password change, locale), addresses stored but unused in quote, order timeline. <!-- authority: llm-explicit -->
- Support ticket `assignee_id` and employee/retail paid-order fulfillment overlay. <!-- authority: llm-explicit -->
- Vendor offer create/edit and own-line `packing | shipped | delivered` notes. <!-- authority: llm-explicit -->
- Admin panel split; failed panels error, not zero. <!-- authority: llm-explicit -->
- B2B quote detail/convert/PO via `stored_objects`; publisher/author requests/MARC only. <!-- authority: llm-explicit -->
- Seed fingerprint: refuse production env and non-loopback/`db` hosts. <!-- authority: llm-explicit -->
- Tests: extend `tests/seed-local-core.test.mjs`, support/vendor/catalog core tests (handler/core, not greps). <!-- authority: llm-explicit -->

### Out of scope

- Tax/shipping/returns/settlement/royalty/B2B payment terms (unsigned DEC-*), live keys, WordPress DNS, Google/MFA, private `app` schema, self-setting `done`. <!-- authority: llm-explicit -->

## Dependencies

`TASK-UI-001` and `TASK-COM-001` are the in-flight audit set. This task is eligible only after those complete HITL (`testing → done`). HITL remains required at reviewing → ready_to_test and testing → done. Do not request HITL while authoring. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Cursor agent authoring the local-complete golive wave queue. <!-- authority: llm-explicit -->
- Human review: Operator HITL at the two acceptance gates after implementation. <!-- authority: llm-explicit -->
