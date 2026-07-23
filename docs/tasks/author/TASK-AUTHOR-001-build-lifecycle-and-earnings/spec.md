---
id: TASK-AUTHOR-001
title: "Add author manuscript lifecycle stages and earnings views"
template: task@1
type: feature
module: author
author: "@codex"
department: engineering
status: ready_to_review
entered_via: audit
priority: p1
created_at: "2026-07-23T05:59:54Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-ROYALTY-001
source_ref:
  - docs/03-portals.md:56-58
  - docs/05-data-model.md:49-52
  - docs/07-status-roadmap.md:25,32
  - docs/01-vision.md:19-20
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:56-58; docs/05-data-model.md:49-52; docs/07-status-roadmap.md:25,32; docs/01-vision.md:19-20; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Show each author the recovered `PublishingRequest` log history as the current manuscript lifecycle evidence and, only after an owner-accepted royalty policy, show source-confirmed earned facts in a read-only view. Do not invent manuscript stages, rights, earnings calculations, payments, or a new publishing workflow. <!-- authority: human-confirmed -->

## Problem

The author portal already supports manuscript submission and request list and detail views, with a `PublishingRequest` and `PublishingRequestLog` trail. Its dashboard stages and earnings are mocked, and earnings depend on the royalty model. <!-- authority: llm-explicit -->

The handoff does not define a manuscript-stage taxonomy, transition authority, author rights, royalty formula, earned amount relation, payout process, payment terms, or access policy for financial facts. A portal view must use current request-log evidence and accepted royalty data only. <!-- authority: human-confirmed -->

## Proposed Solution

After `TASK-ROYALTY-001` recovers the relevant data contract and receives explicit owner acceptance for financial rules, render the existing request-log history as the source-confirmed lifecycle view for its author. Render earned facts only when the accepted policy and recovered source establish them, and keep the view read-only. <!-- authority: human-confirmed -->

If the recovered source does not establish an author-scoped history, a financial fact, or the authorization boundary, record the evidence gap and request a product decision instead of creating stage names, amounts, rights, or payments. <!-- authority: human-confirmed -->

## Alternatives Considered

Create a standard manuscript stage model for all authors. This was rejected because the source documents a request log trail but no stage taxonomy or transition policy. <!-- authority: human-confirmed -->

Show estimated earnings before the royalty rules are accepted. This was rejected because the roadmap identifies the royalty model as the blocker and an estimate would be an invented financial fact. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: author dashboard stages and earnings are mocked, while requests already have a log trail. Target: an author can view only recovered request-log history and, when an accepted policy plus source data establishes it, read-only earned facts for that author, or the task records a bounded evidence gap. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the sources do not establish stage definitions, rights, royalty calculations, payout rules, or payment terms. Target: this task creates no stage transition, right assignment, earnings calculation, payout, payment instruction, or financial write. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope replaces source-confirmed mock presentation with author-scoped read-only facts. It treats request-log history as the only documented lifecycle evidence and makes earned facts conditional on the accepted royalty policy. <!-- authority: human-confirmed -->

### In scope

- Recover the author identity boundary, existing `PublishingRequest` and `PublishingRequestLog` relation, and current request detail path. <!-- authority: llm-explicit -->
- Render the recovered request-log history for the authorized author without creating or renaming a stage. <!-- authority: human-confirmed -->
- Render source-confirmed earned facts only after `TASK-ROYALTY-001` has an explicit owner acceptance for the relevant financial rule. <!-- authority: human-confirmed -->
- Record an evidence gap when a history, earned fact, or authorization relation cannot be recovered. <!-- authority: human-confirmed -->

### Out of scope

- Define manuscript stages, transition rules, reviewer actions, publishing rights, or author contracts. <!-- authority: human-confirmed -->
- Create earnings calculations, financial ledgers, payouts, payment instructions, invoices, or tax treatment. <!-- authority: human-confirmed -->
- Change a publishing request, mutate its log, or expose another author's history or earned facts. <!-- authority: human-confirmed -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-ROYALTY-001` must supply a recovered data contract and explicit owner acceptance for any financial rule before this task displays earned facts. An unaccepted proposal cannot drive author-facing values. <!-- authority: human-confirmed -->

The existing `PublishingRequestLog` relation and author authorization boundary must be recovered before implementation. Missing stage, rights, payment, or access rules remain owner decisions rather than implied behavior. <!-- authority: human-confirmed -->

The project constraints against local application execution, committed secrets, and unapproved deployment remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent stages, transition policy, rights, earnings calculations, payment terms, payouts, or author authorization that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An owner must review accepted financial rules and any lifecycle, rights, or payment decision before implementation begins. <!-- authority: human-edited -->
