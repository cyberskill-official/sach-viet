---
id: TASK-B2B-002
title: "Convert approved B2B quotes into orders"
template: task@1
type: feature
module: b2b
author: "@codex"
department: engineering
status: ready_to_review
entered_via: audit
priority: p0
created_at: "2026-07-23T05:59:06Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/01-vision.md:16-18
  - docs/03-portals.md:44-46
  - docs/04-roles-permissions.md:43
  - docs/04-roles-permissions.md:58
  - docs/05-data-model.md:41-45
  - docs/07-status-roadmap.md:31
  - docs/README.md:21-25
provenance:
  - "source_path: docs/01-vision.md"
  - "source_hash: 85bd3a7365b7c6ed3eb5dc449e867b08316b23fb2b055db69a0d5ecb8f0cac23"
  - "source_refs: docs/01-vision.md:16-18; docs/03-portals.md:44-46; docs/04-roles-permissions.md:43,58; docs/05-data-model.md:41-45; docs/07-status-roadmap.md:31; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Add an idempotent B2B quote-to-order conversion only through a recovered existing order path and only for the recovered accepted quote state. If the recovered source confirms `won` as that state, conversion is limited to `won`; otherwise record the eligibility gap. Restrict the action to `employee_b2b` and `admin`, and preserve the broker boundary that keeps upstream suppliers hidden from institutions. <!-- authority: human-confirmed -->

## Problem

The B2B portal has a real quote pipeline and quote management, but quote-to-order conversion remains a documented next-phase item. The data model lists quote states from `draft` through `won` or `lost`, yet it does not define B2B orders, approval rules, idempotency details, payment, invoices, tax, shipping, contracts, or purchase-order handling. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` recovers the current quote and order behavior, allow `employee_b2b` and `admin` to convert one eligible recovered quote through an existing order path. The same eligible quote must not create a second order, and any absent accepted-state rule, order path, access check, or broker-privacy protection must be recorded as a gap. <!-- authority: human-confirmed -->

The conversion must not expose an upstream supplier to an institution. It must not add payment, invoice, tax, shipping, contract, or purchase-order behavior, and it must not invent an approval rule. <!-- authority: human-confirmed -->

## Alternatives Considered

Convert every quote state into an order. This was rejected because the source distinguishes multiple pipeline states and does not define which state is eligible. <!-- authority: llm-explicit -->

Bundle payments, invoices, tax, shipping, contracts, or purchase orders into conversion. This was rejected because the handoff lists quote conversion and contract or PO artifacts as separate unfinished work. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: quote-to-order conversion is listed as not started. Target: source-selected checks show that an authorized staff user can convert only a recovered eligible quote once through an existing order path, or that a missing eligibility rule or order path is recorded as a gap. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the B2B brokerage flow keeps the upstream supplier hidden and does not define financial, shipping, contract, or PO behavior for conversion. Target: source-selected checks show that a conversion does not reveal supplier information or add payment, invoice, tax, shipping, contract, or purchase-order behavior. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is a staff-only conversion on recovered existing data with duplicate prevention. It does not define the downstream commercial lifecycle. <!-- authority: llm-explicit -->

### In scope

- Recover the quote state, order path, authorization boundary, and broker-privacy behavior through `TASK-DISCOVERY-001`. <!-- authority: human-confirmed -->
- Allow only `employee_b2b` and `admin` to convert a recovered eligible quote once. <!-- authority: human-confirmed -->
- Record an absent accepted-state rule, order path, access check, or privacy protection as a gap. <!-- authority: human-confirmed -->

### Out of scope

- Add payment, invoices, tax, shipping, carrier handling, contracts, purchase orders, e-signature, or supplier disclosure. <!-- authority: human-confirmed -->
- Invent a B2B order schema, an approval state, a quote state, or a financial policy. <!-- authority: human-confirmed -->
- Run the application locally, use production data, commit credentials, deploy, or perform a destructive operation without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must recover the existing quote and order behavior before this task selects an accepted state or conversion path. <!-- authority: human-confirmed -->

Financial, tax, shipping, contract, purchase-order, and supplier-disclosure policy remain explicit owner decisions outside this task. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting the handoff and approved default into this task. <!-- authority: human-confirmed -->
- Scope: The task restricts conversion to recovered eligible data and excludes a new commercial lifecycle. <!-- authority: llm-explicit -->
- Human review: An operator must approve any later payment, tax, shipping, contract, PO, or supplier-disclosure scope. <!-- authority: human-edited -->
