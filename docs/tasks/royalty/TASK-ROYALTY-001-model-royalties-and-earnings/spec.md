---
id: TASK-ROYALTY-001
title: "Model royalties and earnings"
template: task@1
type: feature
module: royalty
author: "@codex"
department: engineering
status: done
entered_via: audit
priority: p0
created_at: "2026-07-23T05:56:39Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:52-58
  - docs/07-status-roadmap.md:25,32,59
  - docs/06-tech-stack.md:43-50
  - docs/01-vision.md:19-20
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:52-58; docs/07-status-roadmap.md:25,32,59; docs/06-tech-stack.md:43-50; docs/01-vision.md:19-20; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Create a versioned royalty-policy proposal and a recovered data-contract inventory for the publisher and author portal work. The result is read-only planning evidence and must not calculate earnings, issue a payout, persist financial rules, or expose a financial dashboard before an owner accepts the rules. <!-- authority: human-confirmed -->

## Problem

The publisher and author dashboards are mocked and the roadmap identifies the royalty and earnings model as the blocker for both portals. The suggested early work is a written proposal for that model. <!-- authority: llm-explicit -->

The handoff contains publishing requests and their log trail, but it does not define royalty rates, sales allocation, recoupment, reporting period, currency treatment, payment terms, payout approval, or an authoritative relation between sales and earnings. <!-- authority: human-confirmed -->

## Proposed Solution

After `TASK-DISCOVERY-001` locates the relevant source, prepare a versioned proposal that separates source-confirmed facts from unresolved financial rules. Prepare a data-contract inventory that names recovered inputs and their provenance without inventing a calculation, a persistence model, or a payment action. <!-- authority: human-confirmed -->

Require an explicit owner acceptance for every financial rule before any royalty computation, earnings view, payout, payment instruction, or financial persistence proceeds. If source recovery cannot establish an input or relationship, record it as unresolved rather than filling the gap with an assumption. <!-- authority: human-confirmed -->

## Alternatives Considered

Implement a default royalty formula and adjust it later. This was rejected because the sources explicitly identify the royalty and earnings model as an owner product decision. <!-- authority: human-confirmed -->

Build mocked dashboard figures as a temporary substitute. This was rejected because the current dashboards are already mocked, and this task must reduce uncertainty without introducing more invented financial information. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the royalty and earnings product model is unresolved, and the publisher and author dashboards are mocked. Target: a versioned proposal and a source-recovered data-contract inventory distinguish confirmed facts from unresolved financial rules, with explicit owner acceptance required before financial behavior starts. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff provides no royalty rates, sales allocation rules, payout terms, or approved calculation. Target: this task produces no payout, payment instruction, earnings calculation, or financial dashboard value. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is a policy and data-contract foundation that supports later portal tasks without treating a proposed rule as a live financial rule. It preserves the current source evidence and leaves all financial activation behind an owner gate. <!-- authority: human-confirmed -->

### In scope

- Recover source-confirmed publishing, sales, order, catalog, and role data that may be relevant to a future royalty model. <!-- authority: llm-explicit -->
- Create a versioned royalty-policy proposal that labels each financial rule as source-confirmed, owner-accepted, or unresolved. <!-- authority: human-confirmed -->
- Create a read-only data-contract inventory with provenance for each recovered input and explicit gaps for inputs not present in the source. <!-- authority: human-confirmed -->
- Record an owner-acceptance gate before a calculation, dashboard value, financial persistence, payout, or payment instruction can begin. <!-- authority: human-confirmed -->

### Out of scope

- Choose royalty rates, split rules, recoupment, payment periods, currency handling, tax treatment, or payout approval rules. <!-- authority: human-confirmed -->
- Implement earnings calculations, financial ledgers, payouts, payment instructions, invoices, or a financial dashboard. <!-- authority: human-confirmed -->
- Alter publisher, author, order, or payment data without an accepted policy and an approved implementation task. <!-- authority: human-confirmed -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must locate the application source, current publishing and sales data relationships, and any existing policy material before the proposal and inventory are finalized. An absent relationship remains an explicit gap. <!-- authority: human-confirmed -->

An owner must explicitly accept the proposed financial rules before any downstream implementation of calculations, dashboards, payouts, or financial persistence. That acceptance is an execution gate, not a result that this task can supply. <!-- authority: human-confirmed -->

The project constraints against local application execution, committed secrets, and unapproved deployment remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent royalty rates, split rules, sales allocation, earnings calculations, payment terms, payout authority, or a financial data model that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An owner must review and explicitly accept each financial rule before implementation begins. <!-- authority: human-edited -->
