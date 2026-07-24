---
id: TASK-REBUILD-023
title: "Prove B2C parity and plan cutover"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
priority: p0
created_at: "2026-07-24T13:47:49Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-005
  - TASK-REBUILD-007
  - TASK-REBUILD-008
  - TASK-REBUILD-021
  - TASK-REBUILD-022
source_ref:
  - docs/01-vision.md:24-40
  - docs/03-portals.md:9-26
  - docs/06-tech-stack.md:38-41
  - docs/07-status-roadmap.md:29-55
provenance:
  - "source_path: docs/01-vision.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
  - "operator_standing_order: never push/deploy/merge; session waiver covers routine HITL only; no production cutover"
  - "parity_claim_policy: greenfield B2C capability coverage via fixtures/APIs/tests only; MUST NOT claim live WordPress feature parity without live legacy comparison evidence"
  - "related_on_hold: docs/tasks/cutover/TASK-CUTOVER-001-define-b2c-parity (leave on_hold)"
  - "related_on_hold: docs/tasks/cutover/TASK-CUTOVER-002-execute-wordpress-cutover (leave on_hold)"
  - "related_on_hold: docs/tasks/migration/TASK-MIGRATION-001-reconcile-wp-order-items (leave on_hold)"
  - "related_done: TASK-REBUILD-005,007,008,021,022 left intact"
shipped: "2026-07-24"
---

# Task

## Summary

Prove greenfield B2C capability coverage with an evidence matrix and automated fixture/API checks, and author a cutover plan that records go/no-go gates without executing production cutover, DNS changes, or WordPress retirement. <!-- authority: human-confirmed -->

## Problem

The north star requires the new B2C storefront to reach feature parity with the live WordPress store before `sachviet.us` cutover, while WordPress remains live until replacement and the plan is parity-then-cutover rather than a hybrid frankenstein. <!-- authority: llm-explicit -->

Greenfield Tasks 1–22 shipped catalog, cart/checkout, support, admin commerce, vendor payouts, WP import compatibility, and a quality/preview-release bar — but there is no single closed B2C evidence matrix that maps source-confirmed storefront flows to greenfield proof status, and no cutover plan artefact that lists unmet gates without inventing a go decision. Non-rebuild `TASK-CUTOVER-001` / `TASK-CUTOVER-002` stay on hold under the greenfield-only decision and must not be reopened. Live WordPress comparison data is unavailable in this session, so claiming live WP parity would be fabrication. <!-- authority: human-confirmed -->

## Proposed Solution

Add a `b2c-parity-cutover-core` module (or equivalent) in `app/web` plus committed plan artefacts under the task `ship/` folder that:

1. Defines a closed B2C capability checklist derived from source-confirmed `/ecom` storefront areas and the B2C-supporting commerce surfaces already in rebuild scope (catalog browse/detail, cart, hosted checkout, order history, auth, support tickets, goods requests, vendor self-registration, admin vendor approval/payouts, multi-vendor offers, Vietnamese search, WP import compatibility, quality/preview bar). Each row MUST carry exactly one status from the closed set: `greenfield_proven` | `source_gap` | `evidence_unavailable` | `deferred_out_of_scope`. <!-- authority: human-confirmed -->
2. Produces a B2C evidence matrix artefact that distinguishes (a) rows proven by greenfield fixtures/tests/verify scripts, (b) source-documented flows still marked gap, (c) rows that cannot be verified without live legacy comparison data (`evidence_unavailable`), and (d) explicitly deferred items. The matrix MUST NOT assert `live_wp_parity` or any equivalent live-parity claim. <!-- authority: human-confirmed -->
3. Produces a cutover plan artefact that records the gate checklist for a future owner go/no-go (parity evidence packet complete, quality/preview bar green, backup verified, named rollback plan, owner go decision, separate deployment instruction) without executing any gate, inventing cutover windows/DNS plans/credentials, or treating this task status as deployment authority. Adapt the gate language to greenfield Next.js `app/web` (not Nuxt/Laravel revival). <!-- authority: llm-explicit -->
4. Provides automated checks that (a) the checklist is complete and every row has a closed-set status, (b) every `greenfield_proven` row cites an existing greenfield verify script or core module evidence key, (c) the matrix rejects unknown statuses and forbids live-parity claim fields, (d) the cutover plan refuses production actions in the default path (`refused_production` / equivalent), and (e) on-hold cutover/migration task paths remain untouched. <!-- authority: human-confirmed -->
5. Wires a verify script into `npm run verify` and documents the evidence-matrix + cutover-plan outcomes in `OPERATIONS.md` (or equivalent) as planning artefacts, not as production authorization. <!-- authority: llm-explicit -->

Leave Tasks 1–22 product cores intact aside from minimal verify/OPERATIONS wiring. Leave `TASK-CUTOVER-001`, `TASK-CUTOVER-002`, and `TASK-MIGRATION-001` on hold. Do not push, deploy, merge, change DNS, retire WordPress, or revive WordPress/WooCommerce/Dokan as the product runtime. <!-- authority: human-confirmed -->

## Alternatives Considered

Claim live WordPress B2C feature parity from greenfield tests alone. This is rejected because live legacy comparison data is unavailable and fabricating parity would violate anti-fabrication and the cutover readiness doctrine. <!-- authority: human-confirmed -->

Reopen and implement `TASK-CUTOVER-001` / `TASK-CUTOVER-002` instead of a greenfield rebuild task. This is rejected by standing orders to leave non-rebuild `on_hold` work alone; this task supersedes only by producing greenfield-owned evidence/plan artefacts, not by mutating cutover specs. <!-- authority: human-confirmed -->

Execute DNS cutover, CapRover production promote, or WordPress retirement once the matrix looks complete. This is rejected because sources require separate owner go + deployment instruction, and standing orders forbid push/deploy/merge in this session. <!-- authority: human-confirmed -->

Require CapRover `sachviet-current` / live WooCommerce admin access before CI can pass. This is rejected because greenfield CI must stay credential-free and fixture-driven. <!-- authority: human-confirmed -->

Build a hybrid frankenstein that keeps WordPress plugins in the product path. This is rejected by the known dead-end: parity-then-cutover, not piecemeal Dokan/WP replacement. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: greenfield has B2C cores and import/quality bars but no closed evidence matrix or cutover plan with automated coverage checks. Target: tests/verify prove the closed B2C checklist is populated with only closed-set statuses, every `greenfield_proven` row cites greenfield evidence, live-parity claims are refused, cutover plan lists unmet gates without executing them, and `npm run verify` includes the new verifier. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: standing orders forbid push/deploy/merge and live cutover; cutover/migration stay on hold; prior cores stay intact. Target: inspection/tests prove no DNS/production/WP-retirement action, no mutation of on-hold cutover/migration specs, no WordPress PHP runtime revival, no CapRover/GitHub credential invention, and Tasks 1–22 cores unchanged beyond minimal verify/OPERATIONS wiring. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

This task establishes greenfield B2C capability evidence and a non-executing cutover plan. It does not claim live WordPress parity or perform production cutover. <!-- authority: llm-explicit -->

### In scope

- Closed B2C capability checklist with closed-set row statuses. <!-- authority: human-confirmed -->
- Evidence matrix artefact that forbids live WP parity claims and records `evidence_unavailable` where live comparison is missing. <!-- authority: human-confirmed -->
- Cutover plan artefact listing go/no-go gates for greenfield Next.js without executing them. <!-- authority: llm-explicit -->
- Automated core checks + verify script wired into `npm run verify`. <!-- authority: llm-explicit -->
- OPERATIONS (or equivalent) documentation of matrix/plan as planning artefacts only. <!-- authority: human-confirmed -->

### Out of scope

- Live WordPress/WooCommerce comparison, CapRover `sachviet-current` access, or production re-import. <!-- authority: human-confirmed -->
- DNS changes, Cloudflare changes, production deploy/promote, traffic switch, or WordPress retirement. <!-- authority: human-confirmed -->
- Pushing to GitHub, opening PRs, merging, or storing hosting credentials. <!-- authority: human-confirmed -->
- Reopening or implementing `TASK-CUTOVER-001`, `TASK-CUTOVER-002`, or `TASK-MIGRATION-001`. <!-- authority: human-confirmed -->
- Inventing cutover windows, DNS records, rollback runbooks with unverified backup locations, or owner go decisions. <!-- authority: llm-explicit -->
- Expanding B2B, publisher, author, or royalty scope beyond B2C checklist coverage notes. <!-- authority: llm-explicit -->
- Mutating Tasks 1–22 product cores beyond minimal verify/OPERATIONS wiring. <!-- authority: human-confirmed -->

## Dependencies

Tasks 5, 7, 8, 21, and 22 provide storefront commerce, admin commerce, vendor payouts, WP import compatibility, and the quality/preview-release bar that the evidence matrix cites. Non-rebuild cutover tasks remain on hold and are documentation siblings only. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented B2C storefront/cutover north star, greenfield-only constraints, and standing orders into this rebuild evidence-and-plan task. <!-- authority: human-confirmed -->
- Scope: The task produces greenfield B2C capability evidence and a non-executing cutover plan; it excludes live WP parity claims, production cutover, and on-hold cutover/migration implementation. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue, session-wide routine acceptance gates, and standing orders to never push/deploy/merge, leave non-rebuild on_hold alone, and pause only for real decisions. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-023.*
