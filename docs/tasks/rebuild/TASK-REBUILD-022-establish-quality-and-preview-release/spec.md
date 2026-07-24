---
id: TASK-REBUILD-022
title: "Establish quality and preview release"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
shipped: "2026-07-24"
priority: p0
created_at: "2026-07-24T13:43:15Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-001
  - TASK-REBUILD-002
  - TASK-REBUILD-003
source_ref:
  - docs/README.md:19-31
  - docs/02-architecture.md:81-94
  - docs/06-tech-stack.md:3-22,43-57
  - docs/07-status-roadmap.md:53-58
provenance:
  - "source_path: docs/02-architecture.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
  - "operator_standing_order: never push/deploy/merge without explicit operator instruction; session waiver covers routine HITL only"
  - "credential_policy: CapRover/preview live deploy is optional; process + local/CI scripts MUST complete without live hosting credentials"
  - "related_done: TASK-REBUILD-001 (foundation quality commands + CapRover packaging left intact)"
  - "related_on_hold: leave non-rebuild on_hold tasks alone"
---

# Task

## Summary

Establish the greenfield `app/web` quality-gate and preview-release process: a documented, scriptable pre-review checklist (lint, test, verify, build, CyberOS gates), CapRover preview packaging validation that runs without live hosting credentials, and explicit refusal of production deploy or push from this task. <!-- authority: human-confirmed -->

## Problem

Handoff conventions require code → self-review (typecheck/lint/tests) → private GitHub → CapRover preview → verify on the real URL, and never treat a local long-running server as acceptance. Task 1 already added lint/test/verify/build entry points plus Docker and CapRover packaging, but the greenfield app still lacks a single quality-and-preview-release process module that (a) aggregates the required checks, (b) validates preview packaging offline, and (c) records when live CapRover credentials are absent without failing the task. <!-- authority: llm-explicit -->

Standing orders forbid push, deploy, and merge in this session. CapRover or preview hosting credentials may be missing. The task must therefore ship a process that completes on local/CI evidence and must not require a live preview deploy to reach `done`. <!-- authority: human-confirmed -->

## Proposed Solution

Add a `quality-preview-release-core` module (or equivalent) in `app/web` that:

1. Defines a closed quality checklist for greenfield `app/web`: `lint`, `test`, `verify`, `build`, and the repo CyberOS gate command `bash .cyberos/cuo/gates/run-gates.sh`. Document the same checklist in `OPERATIONS.md` (or equivalent) as the pre-review and pre-preview-release bar. <!-- authority: human-confirmed -->
2. Defines a preview-release preparation mode that validates `Dockerfile`, `captain-definition` (schemaVersion 2), standalone Next.js packaging assumptions, and secret-handling constraints without contacting CapRover, GitHub, or any remote host. <!-- authority: llm-explicit -->
3. Provides a prepare/dry-run script that exits successfully when packaging and quality contracts pass locally, and records a structured outcome of `prepared_local` when live CapRover credentials are absent — never inventing tokens, never writing secrets, and never calling a deploy API. <!-- authority: human-confirmed -->
4. Explicitly refuses production deploy and unauthorized push/merge: any prepare path that targets production or attempts remote publish without an explicit operator-authorized credential path MUST fail closed with a clear error class (for example `refused_production` / `missing_preview_credentials`). <!-- authority: human-confirmed -->
5. Adds core tests and a verify script proving checklist completeness, offline package validation, credential-absent success path, production-refusal path, and absence of network deploy calls in the default path. Wire the verify script into `npm run verify`. <!-- authority: llm-explicit -->

Leave Tasks 1–21 cores, wordpress-import, and non-rebuild `on_hold` work intact. Do not push, deploy, merge, or add CapRover/GitHub credentials to the repository. <!-- authority: human-confirmed -->

## Alternatives Considered

Require a live CapRover preview deploy and real `*.server.sachviet.us` browser check before this task can finish. This is rejected because standing orders forbid deploy in this session and credentials may be absent; the mission authorizes local/CI process completion without live hosting credentials. <!-- authority: human-confirmed -->

Add GitHub Actions that push or deploy on every green build. This is rejected because private-repo CI may be desirable later, but automatic remote publish contradicts the no-push/no-deploy standing order and is not required to establish the process. <!-- authority: llm-explicit -->

Treat Task 1's existing OPERATIONS notes as sufficient and skip a verifiable process module. This is rejected because Task 23 (parity/cutover planning) depends on a named quality and preview-release bar with testable outcomes, not prose alone. <!-- authority: llm-explicit -->

Reuse or revive `app/misc/deploy.sh` from the inherited Nuxt/Laravel stack. This is rejected under greenfield-only discipline; the greenfield process must live under `app/web` against Next.js packaging. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: greenfield has foundation quality commands and CapRover packaging files, but no dedicated quality-and-preview-release process module with offline prepare outcomes and production refusal. Target: tests/verify prove the checklist is documented and enforced, offline package validation passes, credential-absent prepare returns `prepared_local`, production/unauthorized remote paths refuse, and `npm run verify` includes the new verifier. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: standing orders forbid push/deploy/merge; secrets must stay out of git; prior cores stay intact. Target: inspection/tests prove no CapRover/GitHub credential files added, no default-path network deploy, no mutation of Tasks 1–21 product cores beyond the minimal OPERATIONS/package.json verify wiring needed here, and no production deploy script that runs without explicit operator authorization. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

This task establishes the greenfield quality-gate and preview-release process for `app/web`. It does not perform a live preview deploy, production release, or remote push. <!-- authority: llm-explicit -->

### In scope

- Quality checklist core + OPERATIONS documentation for lint, test, verify, build, and CyberOS gates. <!-- authority: human-confirmed -->
- Offline CapRover/Docker preview packaging validation (captain-definition schemaVersion 2, Dockerfile, standalone constraints, secret rules). <!-- authority: llm-explicit -->
- Prepare/dry-run script with `prepared_local` when live credentials are absent. <!-- authority: human-confirmed -->
- Closed refusal of production deploy and unauthorized remote publish from the default path. <!-- authority: human-confirmed -->
- Core/route-free tests and verify script wired into `npm run verify`. <!-- authority: llm-explicit -->

### Out of scope

- Live CapRover deploy, CapRover dashboard login, or browser acceptance on `*.server.sachviet.us`. <!-- authority: human-confirmed -->
- Production promotion, DNS cutover, Cloudflare changes, or WordPress retirement. <!-- authority: human-confirmed -->
- Pushing to GitHub, opening PRs, merging, or storing CapRover/GitHub tokens in the repo. <!-- authority: human-confirmed -->
- Reopening or implementing non-rebuild `on_hold` quality/cutover/migration tasks. <!-- authority: human-confirmed -->
- Mutating wordpress-import or Tasks 1–21 product cores beyond minimal verify/OPERATIONS wiring. <!-- authority: human-confirmed -->
- Inventing a full GitHub Actions CI matrix as a mandatory deliverable (documenting the local/CI command bar is enough). <!-- authority: llm-explicit -->

## Dependencies

Tasks 1–3 provide the Next.js foundation, identity/session baseline, and shared web foundations that quality commands already exercise. Later Task 23 depends on this process as the quality and preview-release bar before parity/cutover planning. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented quality/preview conventions and operator standing orders into this rebuild process task. <!-- authority: human-confirmed -->
- Scope: The task establishes offline quality and preview-release process artefacts for `app/web`; it excludes live deploy, push, merge, and credential invention. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue, session-wide routine acceptance gates, and standing orders to never push/deploy/merge and to complete without live CapRover credentials when absent. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-022.*
