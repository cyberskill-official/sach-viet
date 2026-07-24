---
id: TASK-REBUILD-018
title: "Build author portal and earnings"
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
  - TASK-REBUILD-002
  - TASK-REBUILD-016
source_ref:
  - docs/01-vision.md:19-21
  - docs/03-portals.md:56-58
  - docs/05-data-model.md:47-53
  - docs/07-status-roadmap.md:20-36
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/01-vision.md:19-21; docs/03-portals.md:56-58; docs/05-data-model.md:47-53; docs/07-status-roadmap.md:20-36"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
  - "activation_gate: docs/tasks/rebuild/TASK-REBUILD-016-define-royalty-and-earnings-policy/ship/royalty-policy-proposal.md"
  - "related_done: docs/tasks/author/TASK-AUTHOR-001-build-lifecycle-and-earnings (done; leave unchanged)"
  - "related_done: docs/tasks/royalty/TASK-ROYALTY-001-model-royalties-and-earnings (done; leave unchanged)"
  - "upstream_done: docs/tasks/rebuild/TASK-REBUILD-017-build-publisher-portal-and-royalties (done; leave publisher scaffolding and refuse paths intact)"
---

# Task

## Summary

Build the greenfield `/author` portal foundation under the TASK-REBUILD-016 owner-acceptance activation gate: signed-session author manuscript-request surfaces that are non-financial, plus an author dashboard that returns explicit policy-pending placeholders for earnings and expanded pipeline stages. Do not invent rates, splits, allocation, settlement math, tax, payouts, ledger values, review-stage machines, or dashboard financial amounts. <!-- authority: human-confirmed -->

## Problem

The `/author` portal is documented as needing real manuscript pipeline stages and earnings once a royalty model exists, while manuscript submit and requests list/detail are named as existing author surfaces in the handoff. Author dashboard earnings/stages remain fully mocked and blocked on the royalty/earnings product decision. <!-- authority: llm-explicit -->

Greenfield already reserves the `author` role, portal ACL, orange accent, and `/author` proxy matcher. Task 16 recorded a versioned policy proposal whose decision-register rows are unresolved, and Task 17 shipped publisher scaffolding with an executable activation-gate refuse path that must remain intact. No `app/web/src/app/api/author/**` tree or author earnings core exists. Activating earnings computation, royalty math, or payout automation would invent financial policy the sources forbid. Inventing multi-party review stages would also invent product policy not accepted in the decision register. <!-- authority: human-confirmed -->

## Proposed Solution

Add a SQLite author-portal module and signed-session route handlers in `app/web` that serve `author` and `admin` actors under the existing portal ACL. The module MUST encode the TASK-REBUILD-016 activation gate as an executable refuse path: while any applicable decision-register row remains unresolved (or no owner-accepted activation record is present), financial behavior is refused and financial dashboard fields remain policy-pending placeholders — never invented numbers. Reuse the existing royalty decision-register / activation-gate semantics already shipped by Task 17 (same register areas and acceptance table contract) without rewriting or weakening publisher portal scaffolding, routes, or refuse paths. <!-- authority: human-confirmed -->

Persist author-owned `author_manuscript_requests` as non-financial manuscript submissions with title, optional notes, opaque private storage key (not a public URL), author id, status limited to `submitted` / `withdrawn`, and timestamps. Persist an append-only `author_manuscript_request_logs` trail that records only those source-confirmed status transitions (`submitted` on create, `withdrawn` on withdraw) with actor id and timestamp. Allow the owning author (or admin) to create, list, read detail (including log trail), and withdraw their requests. Do not invent review-stage machines, print-on-demand, royalty linkage, product auto-publish, payment fields, or intermediate lifecycle statuses beyond `submitted` / `withdrawn`. <!-- authority: llm-explicit -->

Expose an author dashboard read that returns: (a) non-financial counts derived only from that author's manuscript requests (for example submitted and withdrawn counts); (b) explicit `policyPending: true` (or equivalent closed marker) for earnings and for expanded pipeline stages beyond the confirmed submitted/withdrawn evidence; (c) an `activationGate` object naming the unresolved decision-register areas and forbidding calculated amounts. Dashboard responses MUST NOT include earnings amounts, royalty totals, tax figures, payout facts, fabricated zero-as-earnings values presented as live financial facts, or invented review-stage progress scores. <!-- authority: human-confirmed -->

Any API or core function that would compute author earnings, allocate sales to an author, persist earnings ledgers, issue payouts or payment instructions, invoice, or expose a dashboard financial value MUST throw or return a closed policy-pending / activation-blocked error while the gate is open. Emit safe structured events that omit session tokens, email addresses, request bodies, payment secrets, and storage keys. Leave `TASK-AUTHOR-001`, `TASK-ROYALTY-001`, `docs/royalty/*`, and Task 17 publisher portal files intact. <!-- authority: human-confirmed -->

## Alternatives Considered

Invent default royalty rates, party splits, or earnings formulas so the dashboard can show real money. This is rejected because Task 16's activation gate requires owner acceptance of every applicable decision-register row before financial activation, and the sources name royalty/earnings as an owner product decision. <!-- authority: human-confirmed -->

Invent a multi-stage manuscript review workflow (for example under-review / accepted / rejected) so the dashboard can show "real stages." This is rejected because no owner-accepted stage machine is documented for greenfield; only submitted/withdrawn evidence plus an append-only status log is source-safe, and expanded stages remain policy-pending. <!-- authority: human-confirmed -->

Reuse vendor payout cores or publisher royalty computation as author earnings. This is rejected because vendor payouts are marketplace seller settlement, Task 16 separates publisher/author earnings from vendor payouts, and Task 17 publisher scaffolding must remain intact rather than be rewritten into a shared settlement engine here. <!-- authority: llm-explicit -->

Mutate or rewrite `TASK-AUTHOR-001` / `TASK-ROYALTY-001` artefacts, or reopen Task 17 publisher files to "share" financial math. This is rejected under greenfield-only rebuild discipline and standing orders to leave publisher scaffolding/refuse paths and non-rebuild done artefacts unchanged. <!-- authority: human-confirmed -->

Defer the entire author portal until every financial rule is accepted. This is rejected because manuscript submit and requests list/detail are source-named non-financial author surfaces that can ship under an explicit policy-pending dashboard without inventing settlement math or review stages. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: greenfield has no author APIs or author earnings core; earnings/stages remain mocked. Target: tests prove an `author` can create/list/detail/withdraw own manuscript requests with a submitted/withdrawn log trail, and read a dashboard that returns non-financial counts plus explicit policy-pending markers for earnings and expanded pipeline stages; unauthorized roles and cross-author access fail. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: Task 16 decision-register rows are unresolved; no owner-accepted rates/splits/allocation/tax/payout rules exist. Target: tests prove earnings computation, sales-allocation totals, earnings persistence, payout/payment-instruction paths, and dashboard financial amounts are refused or marked policy-pending while the gate is open; responses and events omit session tokens, emails, request bodies, payment secrets, and storage keys; `TASK-AUTHOR-001` / `TASK-ROYALTY-001` / `docs/royalty/*` / Task 17 publisher portal scaffolding and refuse paths / vendor payout cores are not mutated for ownership. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

This task establishes the greenfield author portal under the royalty activation gate. It ships non-financial scaffolding and policy-pending financial/stage placeholders only. <!-- authority: llm-explicit -->

### In scope

- Signed-session author/admin manuscript-request create, list, detail (with submitted/withdrawn log trail), and withdraw. <!-- authority: human-confirmed -->
- Author dashboard with non-financial counts and explicit policy-pending placeholders for earnings and expanded pipeline stages. <!-- authority: human-confirmed -->
- Executable activation-gate refuse path that blocks earnings computation, sales allocation to authors, earnings ledger writes, payouts, payment instructions, invoices, and dashboard financial values while decision-register acceptance is absent. <!-- authority: human-confirmed -->
- Reuse of Task 16/17 royalty decision-register activation-gate semantics without rewriting publisher portal scaffolding. <!-- authority: human-confirmed -->
- Safe structured events that exclude session tokens, email addresses, request bodies, payment secrets, and storage keys. <!-- authority: llm-explicit -->

### Out of scope

- Choose or hard-code royalty rates, party splits, eligibility formulas, recoupment, tax/withholding, reporting calendars, currency conversion, or payout controls. <!-- authority: human-confirmed -->
- Compute author earnings, allocate sales to authors, persist financial ledgers, issue payouts or payment instructions, invoices, or display live dashboard financial amounts. <!-- authority: human-confirmed -->
- Invent multi-party review-stage machines, print-on-demand, product auto-publish from manuscripts, or publisher royalty surfaces (Task 17 owns those). <!-- authority: llm-explicit -->
- Mutate `TASK-AUTHOR-001`, `TASK-ROYALTY-001`, `docs/royalty/*`, Task 17 publisher portal scaffolding/refuse paths, vendor payout cores, or deploy. <!-- authority: human-confirmed -->

## Dependencies

Task 2 provides identity, roles, and portal ACL for `author` / `admin`. Task 16 provides the royalty/earnings policy proposal and owner-acceptance activation gate that this task must enforce before any financial behavior. Task 17 already ships publisher scaffolding and the shared activation-gate refuse pattern; this task must consume that gate semantics without mutating those files' ownership or weakening refuse paths. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented author portal needs and TASK-REBUILD-016 activation gate into this greenfield rebuild task. <!-- authority: human-confirmed -->
- Scope: The task builds non-financial author scaffolding and policy-pending dashboard placeholders; it excludes invented rates, splits, settlement math, ledgers, payouts, review-stage machines, and live financial dashboard values. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue, session-wide routine acceptance gates, and the standing order that financial activation requires accepted decision-register rows. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-018.*
