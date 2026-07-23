---
id: TASK-INSTITUTION-001
title: "Add institutional budget tracking and PO submission"
template: task@1
type: feature
module: institution
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p1
created_at: "2026-07-23T05:52:54Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-B2B-002
source_ref:
  - docs/03-portals.md:48-50
  - docs/05-data-model.md:41-44
  - docs/04-roles-permissions.md:31-62
  - docs/07-status-roadmap.md:26
  - docs/README.md:21-25
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/03-portals.md:48-50; docs/05-data-model.md:41-44; docs/04-roles-permissions.md:31-62; docs/07-status-roadmap.md:26; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Add a manually maintained, informational budget view for each organization and a purchase-order submission path against a recovered quote or order context. The task must not make a financial commitment, reserve funds, charge an account, or automate an approval decision. <!-- authority: human-confirmed -->

## Problem

The institution portal exposes catalog, quotes, and selection lists, while its budget and approvals dashboard is display-only. The roadmap says that budget and purchase-order tracking have not been designed. <!-- authority: llm-explicit -->

The documented B2B data model establishes organizations, school-librarian users, selection lists, and a quote lifecycle, but it does not establish a budget ledger, approval rule, purchase-order format, storage location, or financial-accounting contract. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-B2B-002` recovers the quote-to-order contract, provide a source-confirmed organization budget record that authorized staff maintain manually for information only. Permit a `school_librarian` to submit a purchase-order request only against the recovered quote or order context, then route it to the source-confirmed `employee_b2b` or `admin` review boundary without changing financial state. <!-- authority: human-confirmed -->

If the recovered purchase-order workflow requires a file artifact, wait for `TASK-B2B-003` before attaching or associating that artifact. If discovery does not establish a quote or order relation, authorization boundary, or retained request representation, record the evidence gap and ask for a product decision instead of creating one. <!-- authority: human-confirmed -->

## Alternatives Considered

Automatically approve, reject, reserve, or charge against a budget. This was rejected because the available sources say the model and approval process are not designed, and the approved default limits the budget to informational use. <!-- authority: human-confirmed -->

Create a financial ledger, invoice, payment, or accounting integration. This was rejected because the handoff does not establish those contracts, and they are outside an institution-facing budget display and request submission path. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the institution dashboard budget and approval area is display-only and budget or PO tracking is not designed. Target: an authorized organization can view a manually maintained informational budget value and submit a request against a source-confirmed quote or order without any automatic financial or approval effect. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: no source establishes a budget ledger, approval rule, purchase-order file contract, or storage policy. Target: the implementation uses only recovered data and authorization contracts, or records an evidence gap for an owner decision. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope adds a bounded institutional workflow after the B2B conversion contract is recovered. It preserves the single-role model and puts any undecided financial, legal, file, or approval behavior outside the task. <!-- authority: llm-explicit -->

### In scope

- Locate the recovered organization, quote or order relation, current role guards, and existing request representation before implementation. <!-- authority: llm-explicit -->
- Display a manually maintained informational budget value only for the authorized organization. <!-- authority: human-confirmed -->
- Allow a `school_librarian` to submit a purchase-order request against the recovered quote or order context for `employee_b2b` or `admin` review. <!-- authority: human-confirmed -->
- Preserve organization isolation and record a bounded evidence gap when a required source contract is absent. <!-- authority: human-confirmed -->
- Use `TASK-B2B-003` as an additional prerequisite if the recovered purchase-order workflow requires a file artifact. <!-- authority: human-confirmed -->

### Out of scope

- Calculate, reserve, commit, charge, reconcile, or transfer money. <!-- authority: human-confirmed -->
- Auto-approve or auto-reject a request, define budget eligibility, or create a new approval policy. <!-- authority: human-confirmed -->
- Invent purchase-order fields, a document format, file storage, retention rules, supplier visibility, or external delivery. <!-- authority: llm-explicit -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-B2B-002` must recover the accepted quote-to-order relation and its applicable authorization boundary before implementation begins. This task treats that recovered relation as the only basis for a purchase-order request. <!-- authority: human-confirmed -->

`TASK-B2B-003` becomes an additional dependency only when the recovered workflow requires a purchase-order file artifact. Legal wording, retention, and storage policy remain deferred for an owner decision because the sources do not specify them. <!-- authority: human-confirmed -->

The project constraints against local application execution, committed secrets, and unapproved deployment remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a financial ledger, approval policy, purchase-order format, file store, supplier exposure, or authority that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins, including any financial, legal, storage, or approval decision. <!-- authority: human-edited -->
