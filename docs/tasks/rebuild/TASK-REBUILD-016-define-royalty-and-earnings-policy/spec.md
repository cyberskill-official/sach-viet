---
id: TASK-REBUILD-016
title: "Define royalty and earnings policy"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
priority: p0
shipped: "2026-07-24"
created_at: "2026-07-24T00:00:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on: []
source_ref:
  - docs/01-vision.md:19-21
  - docs/03-portals.md:52-58
  - docs/06-tech-stack.md:43-50
  - docs/07-status-roadmap.md:20-36
provenance:
  - "source_path: docs/03-portals.md"
  - "source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485"
  - "source_refs: docs/01-vision.md:19-21; docs/03-portals.md:52-58; docs/06-tech-stack.md:43-50; docs/07-status-roadmap.md:20-36"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
  - "related_done: docs/tasks/royalty/TASK-ROYALTY-001-model-royalties-and-earnings (done; leave unchanged)"
  - "related_on_hold: docs/tasks/publisher/TASK-PUBLISHER-001-build-financial-dashboard (on_hold; leave unchanged)"
---

# Task

## Summary

Inventory source-confirmed royalty and earnings gaps for the greenfield rebuild, then record a versioned policy foundation and input inventory that separates confirmed context from unresolved financial rules. Do not invent rates, splits, settlement math, ledgers, payouts, or publisher/author financial dashboards in this task. <!-- authority: human-confirmed -->

## Problem

The self-publishing pillar calls for long-term royalty tracking for Vietnamese-language authors abroad, while the publisher portal needs a royalty model plus real sales rollups and the author portal needs earnings once that model exists. Publisher and author dashboards are fully mocked today, and the tech-stack handoff names the royalty and earnings model as an owner product decision before backend work. <!-- authority: llm-explicit -->

The greenfield rebuild already reserves `publisher` and `author` roles, portal ACL entries, accents, and `/publisher` / `/author` proxy matchers, but it has no publisher or author royalty APIs, no earnings core, and no owner-accepted financial rules. Downstream Tasks 17 and 18 cannot safely activate royalty or earnings behavior without a written policy gate. <!-- authority: llm-explicit -->

## Proposed Solution

Produce a greenfield-scoped royalty and earnings policy proposal plus a recovered input inventory under this task's `ship/` folder. Label each financial decision area as source-confirmed context, unresolved, or (only after an explicit owner record) owner-accepted. Require owner acceptance of every applicable financial rule before any royalty computation, earnings view, financial persistence, payout, payment instruction, invoice, or dashboard financial value may begin in Tasks 17 or 18. <!-- authority: human-confirmed -->

Inventory greenfield reservations and absences in `app/web` without treating role/ACL/proxy placeholders as a shipped financial product. Reuse the decision-area structure already established by the completed handoff royalty foundation as planning evidence, but do not mutate `TASK-ROYALTY-001`, `docs/royalty/*`, `TASK-PUBLISHER-001`, or `TASK-AUTHOR-001`. <!-- authority: human-confirmed -->

If a required relationship cannot be recovered from source, record it as missing rather than substituting a default rate, split, recipient, allocation, tax rule, or payout control. <!-- authority: human-confirmed -->

## Alternatives Considered

Invent a default royalty formula so Tasks 17 and 18 can ship financial dashboards immediately. This is rejected because the sources explicitly require an owner product decision before backend royalty work. <!-- authority: human-confirmed -->

Implement payout automation or a settlement ledger in this task. This is rejected because no source establishes payout approval, payment method, settlement timing, or ledger semantics, and this task is a policy foundation only. <!-- authority: llm-explicit -->

Port or rewrite the completed handoff `TASK-ROYALTY-001` artefacts in place, or un-hold `TASK-PUBLISHER-001`. This is rejected under greenfield-only rebuild discipline; non-rebuild royalty and publisher work stays untouched. <!-- authority: human-confirmed -->

Treat vendor marketplace payouts as the royalty model. This is rejected because vendor payouts belong to marketplace seller settlement, while publisher royalties and author earnings are a distinct self-publishing pillar with no source-confirmed mapping onto vendor payouts. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: royalty and earnings remain an unresolved product decision; publisher and author financial dashboards are mocked; greenfield has no royalty or earnings core. Target: a versioned greenfield policy proposal and input inventory distinguish confirmed context from unresolved financial rules, state the owner-acceptance activation gate for Tasks 17 and 18, and confirm this task adds no settlement math or payout automation. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: no source-confirmed rate, split, allocation, tax, or payout rule exists. Target: inspection proves this task creates no royalty calculation, financial ledger, payout, payment instruction, publisher/author financial API, dashboard financial value, or mutation of `TASK-ROYALTY-001` / `TASK-PUBLISHER-001` / `docs/royalty/*`. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

This task records a greenfield royalty and earnings policy foundation. It excludes financial activation, portal construction, and settlement automation. <!-- authority: llm-explicit -->

### In scope

- Inventory source-confirmed royalty and earnings gaps from vision, portals, tech-stack, and roadmap sources. <!-- authority: llm-explicit -->
- Inventory greenfield publisher/author role, ACL, accent, and proxy reservations versus absent royalty/earnings APIs and cores. <!-- authority: llm-explicit -->
- Write a versioned policy proposal that lists financial decision areas without choosing rates, splits, or settlement math. <!-- authority: human-confirmed -->
- Write a read-only input inventory with provenance for recovered commerce, catalog, publishing, and role context, plus explicit missing contracts. <!-- authority: human-confirmed -->
- Record the owner-acceptance gate that blocks Tasks 17 and 18 from activating financial behavior on unresolved rules. <!-- authority: human-confirmed -->
- Preserve reviewable artefacts under this task's `ship/` folder. <!-- authority: human-confirmed -->

### Out of scope

- Choose royalty rates, party splits, eligibility formulas, recoupment, tax treatment, reporting calendars, currency conversion rules, or payout controls. <!-- authority: human-confirmed -->
- Implement earnings calculations, financial ledgers, payouts, payment instructions, invoices, or publisher/author financial dashboards or APIs. <!-- authority: human-confirmed -->
- Build or restyle publisher/author portal product pages beyond the existing shared shell reservations. <!-- authority: human-confirmed -->
- Mutate `TASK-ROYALTY-001`, `docs/royalty/*`, `TASK-PUBLISHER-001`, `TASK-AUTHOR-001`, vendor payout cores, B2B quote/order cores, or deploy. <!-- authority: human-confirmed -->

## Dependencies

No rebuild task dependency is required to write the policy foundation. Tasks 2 and 3 already reserve publisher and author access surfaces that this inventory must distinguish from a shipped financial product. Tasks 17 and 18 depend on this foundation and must honor the owner-acceptance activation gate before any financial behavior. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented royalty and earnings product gap and greenfield reservations into this policy-foundation task. <!-- authority: human-confirmed -->
- Scope: The task records unresolved financial decision areas and recovered inputs; it does not invent rates, splits, settlement math, ledgers, payouts, or financial dashboards. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue and session-wide routine acceptance gates; non-rebuild royalty and publisher work stays untouched. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-016.*
