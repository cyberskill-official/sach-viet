---
id: TASK-REBUILD-017
title: "Build publisher portal and royalties"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
priority: p0
created_at: "2026-07-24T00:00:00+07:00"
shipped: "2026-07-24"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-004
  - TASK-REBUILD-016
source_ref:
  - docs/01-vision.md:19-21
  - docs/03-portals.md:52-54
  - docs/05-data-model.md:47-53
  - docs/07-status-roadmap.md:20-36
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/01-vision.md:19-21; docs/03-portals.md:52-54; docs/05-data-model.md:47-53; docs/07-status-roadmap.md:20-36"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
  - "activation_gate: docs/tasks/rebuild/TASK-REBUILD-016-define-royalty-and-earnings-policy/ship/royalty-policy-proposal.md"
  - "related_on_hold: docs/tasks/publisher/TASK-PUBLISHER-001-build-financial-dashboard (on_hold; leave unchanged)"
  - "related_done: docs/tasks/royalty/TASK-ROYALTY-001-model-royalties-and-earnings (done; leave unchanged)"
---

# Task

## Summary

Build the greenfield `/publisher` portal foundation under the TASK-REBUILD-016 owner-acceptance activation gate: signed-session publisher publishing-request and MARC-metadata surfaces that are non-financial, plus a publisher dashboard that returns explicit policy-pending placeholders for royalties, sales rollups, and contracts. Do not invent rates, splits, allocation, settlement math, tax, payouts, ledger values, or dashboard financial amounts. <!-- authority: human-confirmed -->

## Problem

The `/publisher` portal is documented as needing a royalty model plus real sales rollups and contract management, while product list/submit and MARC upload are named as existing publisher surfaces in the handoff. Publisher dashboard royalties/sales/contracts remain fully mocked and blocked on the royalty/earnings product decision. <!-- authority: llm-explicit -->

Greenfield already reserves the `publisher` role, portal ACL, purple accent, and `/publisher` proxy matcher, and Task 16 recorded a versioned policy proposal whose decision-register rows are unresolved. No `app/web/src/app/api/publisher/**` tree or publisher royalty core exists. Activating royalty computation, sales allocation, or payout automation would invent financial policy the sources forbid. <!-- authority: human-confirmed -->

## Proposed Solution

Add a SQLite publisher-portal module and signed-session route handlers in `app/web` that serve `publisher` and `admin` actors under the existing portal ACL. The module MUST encode the TASK-REBUILD-016 activation gate as an executable refuse path: while any applicable decision-register row remains unresolved (or no owner-accepted activation record is present for this task), financial behavior is refused and financial dashboard fields remain policy-pending placeholders — never invented numbers. <!-- authority: human-confirmed -->

Persist publisher-owned `publishing_requests` as non-financial catalog/manuscript submissions with title, optional notes, opaque private storage key (not a public URL), submitter id, status limited to `submitted` / `withdrawn`, and timestamps. Allow the owning publisher (or admin) to create, list, and withdraw their requests. Do not invent review-stage machines, print-on-demand, royalty linkage, product auto-publish, or payment fields on these rows. <!-- authority: llm-explicit -->

Persist publisher-owned private `publisher_marc_records` metadata keyed by `(publisher_id, product_id)` with an opaque storage key (not a public URL). Allow the owning publisher (or admin) to register or replace and list their MARC metadata for catalog product ids that already exist. Do not invent a MARC serialization format, public download URL, institution entitlement change, or royalty attribution from MARC rows. Institution MARC tables and handlers from Task 15 MUST remain intact. <!-- authority: human-confirmed -->

Expose a publisher dashboard read that returns: (a) non-financial counts derived only from that publisher's publishing requests and MARC rows; (b) explicit `policyPending: true` (or equivalent closed marker) for royalties, sales rollups, and contracts; (c) an `activationGate` object naming the unresolved decision-register areas and forbidding calculated amounts. Dashboard responses MUST NOT include royalty amounts, sales USD totals, contract values, payout facts, tax figures, or fabricated zero-as-earnings values presented as live financial facts. <!-- authority: human-confirmed -->

Any API or core function that would compute royalties, allocate sales to a publisher, persist earnings ledgers, issue payouts or payment instructions, invoice, or expose a dashboard financial value MUST throw or return a closed policy-pending / activation-blocked error while the gate is open. Emit safe structured events that omit session tokens, email addresses, request bodies, payment secrets, and storage keys. Leave `TASK-PUBLISHER-001`, `TASK-ROYALTY-001`, and `docs/royalty/*` unchanged. <!-- authority: human-confirmed -->

## Alternatives Considered

Invent default royalty rates, party splits, or sales-allocation rules so the dashboard can show real money. This is rejected because Task 16's activation gate requires owner acceptance of every applicable decision-register row before financial activation, and the sources name royalty/earnings as an owner product decision. <!-- authority: human-confirmed -->

Reuse vendor payout cores as publisher royalties. This is rejected because vendor payouts are marketplace seller settlement; Task 16 explicitly separates them from publisher/author earnings. <!-- authority: human-confirmed -->

Un-hold or mutate `TASK-PUBLISHER-001` / rewrite `TASK-ROYALTY-001` artefacts. This is rejected under greenfield-only rebuild discipline and standing orders to leave non-rebuild on_hold work alone. <!-- authority: human-confirmed -->

Defer the entire publisher portal until every financial rule is accepted. This is rejected because product list/submit and MARC upload are source-named non-financial publisher surfaces that can ship under an explicit policy-pending dashboard without inventing settlement math. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: greenfield has no publisher APIs or publisher core; royalties/sales/contracts remain mocked. Target: tests prove a `publisher` can create/list/withdraw own publishing requests, register/list own private MARC metadata for existing catalog products, and read a dashboard that returns non-financial counts plus explicit policy-pending markers for royalties, sales, and contracts; unauthorized roles and cross-publisher access fail. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: Task 16 decision-register rows are unresolved; no owner-accepted rates/splits/allocation/tax/payout rules exist. Target: tests prove royalty computation, sales-allocation totals, earnings persistence, payout/payment-instruction paths, and dashboard financial amounts are refused or marked policy-pending while the gate is open; responses and events omit session tokens, emails, request bodies, payment secrets, and storage keys; `TASK-PUBLISHER-001` / `TASK-ROYALTY-001` / `docs/royalty/*` / vendor payout and institution MARC cores are not mutated for ownership. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

This task establishes the greenfield publisher portal under the royalty activation gate. It ships non-financial scaffolding and policy-pending financial placeholders only. <!-- authority: llm-explicit -->

### In scope

- Signed-session publisher/admin publishing-request create, list, and withdraw. <!-- authority: human-confirmed -->
- Signed-session publisher/admin private MARC metadata register/replace and list for existing catalog products, without changing institution MARC entitlement. <!-- authority: human-confirmed -->
- Publisher dashboard with non-financial counts and explicit policy-pending placeholders for royalties, sales rollups, and contracts. <!-- authority: human-confirmed -->
- Executable activation-gate refuse path that blocks royalty computation, sales allocation, earnings ledger writes, payouts, payment instructions, invoices, and dashboard financial values while decision-register acceptance is absent. <!-- authority: human-confirmed -->
- Safe structured events that exclude session tokens, email addresses, request bodies, payment secrets, and storage keys. <!-- authority: llm-explicit -->

### Out of scope

- Choose or hard-code royalty rates, party splits, eligibility formulas, recoupment, tax/withholding, reporting calendars, currency conversion, or payout controls. <!-- authority: human-confirmed -->
- Compute royalties, allocate sales to publishers, persist financial ledgers, issue payouts or payment instructions, invoices, or display live dashboard financial amounts. <!-- authority: human-confirmed -->
- Invent contract-management financial workflows, product auto-publish from requests, print-on-demand, or author-earnings surfaces (Task 18). <!-- authority: llm-explicit -->
- Mutate `TASK-PUBLISHER-001`, `TASK-ROYALTY-001`, `docs/royalty/*`, vendor payout cores, institution MARC cores, or deploy. <!-- authority: human-confirmed -->

## Dependencies

Task 4 provides catalog products that publisher MARC metadata references by product id. Task 16 provides the royalty/earnings policy proposal and owner-acceptance activation gate that this task must enforce before any financial behavior. Task 18 may later build author earnings under the same gate and must not be unblocked by inventing shared settlement math here. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented publisher portal needs and TASK-REBUILD-016 activation gate into this greenfield rebuild task. <!-- authority: human-confirmed -->
- Scope: The task builds non-financial publisher scaffolding and policy-pending dashboard placeholders; it excludes invented rates, splits, settlement math, ledgers, payouts, and live financial dashboard values. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue, session-wide routine acceptance gates, and the standing order that financial activation requires accepted decision-register rows. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-017.*
