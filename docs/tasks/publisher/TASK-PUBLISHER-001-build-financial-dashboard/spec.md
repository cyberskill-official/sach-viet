---
id: TASK-PUBLISHER-001
title: "Add publisher sales rollups, royalties, and contract management"
template: task@1
type: feature
module: publisher
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p1
created_at: "2026-07-23T05:58:24Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-ROYALTY-001
source_ref:
  - docs/03-portals.md:52-54
  - docs/07-status-roadmap.md:25,32
  - docs/06-tech-stack.md:43-50
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:52-54; docs/07-status-roadmap.md:25,32; docs/06-tech-stack.md:43-50; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Replace only source-confirmed mocked publisher dashboard facts with read-only, publisher-scoped sales rollups and royalty facts after the royalty policy has an explicit owner acceptance. Show only recovered contract metadata; do not create, alter, sign, retain, or expose contract contents through this task. <!-- authority: human-confirmed -->

## Problem

The publisher portal has product submission and MARC upload pages, but its dashboard values for royalties, sales, and contracts are fully mocked. The roadmap says the publisher and author dashboards are blocked on a royalty and earnings product decision. <!-- authority: llm-explicit -->

The handoff does not establish the publisher sales relation, rollup interval, royalty calculation, contract fields, legal content, retention policy, signing workflow, or publisher-access contract. A dashboard task must therefore treat `TASK-ROYALTY-001` as the policy and data-contract predecessor. <!-- authority: human-confirmed -->

## Proposed Solution

After `TASK-ROYALTY-001` supplies an owner-accepted policy and recovered data contract, render only the source-confirmed sales and royalty facts for the authenticated publisher in a read-only dashboard view. Use contract metadata only when the recovered source identifies it and applies a publisher-scoped authorization boundary. <!-- authority: human-confirmed -->

If no owner acceptance exists, a required relation cannot be recovered, or a proposed contract field has legal or retention implications, retain the current absence as an evidence gap and ask for the relevant decision. Do not substitute mock or derived values. <!-- authority: human-confirmed -->

## Alternatives Considered

Keep the mocked dashboard values until a later broad dashboard rewrite. This was rejected because the stated task is to make publisher sales rollups and royalties real after the policy foundation exists. <!-- authority: llm-explicit -->

Add contract authoring, negotiation, e-signature, file sharing, or retention at the same time. This was rejected because the sources name contract management as a need but do not establish those legal and storage contracts. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: publisher dashboard royalty, sales, and contract values are fully mocked. Target: the authenticated publisher can view only source-confirmed read-only sales and owner-accepted royalty facts scoped to that publisher, or the task records the missing data contract. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: no source establishes contract contents, retention, signing, or sharing policy. Target: this task exposes only recovered contract metadata and creates no contract content, legal workflow, retention rule, or cross-publisher access. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is a read-only publisher dashboard slice that follows an accepted royalty policy and recovered data contract. It deliberately separates financial display from financial action and contract metadata from legal contract management. <!-- authority: human-confirmed -->

### In scope

- Recover the publisher identity boundary, source sales relationship, accepted royalty facts, and existing dashboard data path from `TASK-ROYALTY-001`. <!-- authority: llm-explicit -->
- Render only source-confirmed, publisher-scoped sales rollups and owner-accepted royalty facts in read-only form. <!-- authority: human-confirmed -->
- Display recovered contract metadata only when its fields and publisher authorization are source-confirmed. <!-- authority: human-confirmed -->
- Record an evidence gap instead of showing mock, derived, or cross-publisher data when a required contract is absent. <!-- authority: human-confirmed -->

### Out of scope

- Create or revise royalty calculations, approve a payout, issue payment instructions, or write financial records. <!-- authority: human-confirmed -->
- Create, edit, negotiate, sign, upload, retain, delete, or share contract contents. <!-- authority: human-confirmed -->
- Define contract terms, legal rights, retention policy, tax treatment, reporting interval, or sales allocation. <!-- authority: human-confirmed -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-ROYALTY-001` must provide a recovered data contract and an explicit owner acceptance for each financial rule before this task shows any royalty fact. A proposed but unaccepted rule cannot feed the dashboard. <!-- authority: human-confirmed -->

Contract metadata may be displayed only after the relevant source fields and publisher authorization boundary are recovered. Legal contents, retention, signing, and sharing remain deferred for an owner and legal decision. <!-- authority: human-confirmed -->

The project constraints against local application execution, committed secrets, and unapproved deployment remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent publisher sales data, royalty calculations, contract fields, legal contents, retention, signing, or sharing behavior that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An owner must review accepted royalty rules, and the appropriate owner must review any legal contract decision before implementation begins. <!-- authority: human-edited -->
