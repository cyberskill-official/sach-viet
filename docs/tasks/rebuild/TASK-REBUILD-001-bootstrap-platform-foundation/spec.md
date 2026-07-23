---
id: TASK-REBUILD-001
title: "Bootstrap the greenfield platform foundation"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: ready_to_implement
priority: p0
created_at: "2026-07-23T00:00:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on: []
source_ref:
  - docs/README.md:1-31
  - docs/02-architecture.md:28-94
  - docs/06-tech-stack.md:3-22
provenance:
  - "source_path: docs/README.md"
  - "source_hash: ee281485ba6c436100e8645d453dd79e8435d695fb02af71f2c4b621a19e3f76"
  - "operator_resolution: greenfield rebuild on 2026-07-23"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
---

# Task

## Summary

Create the empty SachViet application workspace as a greenfield Nuxt 4 frontend and Laravel 10 API foundation. The workspace must support later portal work without reusing the inherited implementation. <!-- authority: human-confirmed -->

## Problem

The repository contains the handoff documents and CyberOS workflow assets, but no SachViet application source. The operator has confirmed that the inherited system is to be rebuilt rather than incrementally improved. <!-- authority: human-confirmed -->

The handoff describes the expected new-platform boundary as `app/web` for Nuxt and `app/api` for Laravel, with separate packaging for CapRover preview. It also defines private repositories, secret isolation, and preview-based verification as project constraints. <!-- authority: llm-explicit -->

## Proposed Solution

Create an `app/` workspace with a Nuxt 4, Vue 3, TypeScript frontend in `app/web` and a Laravel 10, PHP 8.1 API in `app/api`. Establish only the source-confirmed project structure and quality-command baseline needed for the following rebuild tasks. <!-- authority: human-confirmed -->

Provide Docker and CapRover packaging surfaces consistent with the documented preview deployment model, without deploying or adding credentials. Keep application secrets outside version control and preserve the documented rule that browser verification occurs on preview rather than through a locally running application. <!-- authority: llm-explicit -->

## Alternatives Considered

Attempt to locate and adapt the inherited application source. This was rejected because the operator explicitly chose a rebuild from scratch. <!-- authority: human-confirmed -->

Choose a different frontend or API stack. This was deferred because the approved recommended defaults retain the documented Nuxt and Laravel direction, while a stack replacement would be a separate architecture decision. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: this repository has no SachViet application source. Target: the repository contains source-controlled `app/web` and `app/api` foundations matching the documented technology direction, with repeatable build, lint, and test commands. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: project conventions prohibit public repositories, committed secrets, and local application runtime verification. Target: the foundation does not include secrets, does not change repository visibility, and documents preview-only application verification. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

The task creates the greenfield repository foundation and quality-command entry points. It does not implement any business portal, database domain, payment flow, or external integration. <!-- authority: llm-explicit -->

### In scope

- Create the `app/web` and `app/api` source roots described in the architecture handoff. <!-- authority: llm-explicit -->
- Add the source-confirmed Nuxt, Laravel, Docker, and CapRover packaging foundations without credentials. <!-- authority: llm-explicit -->
- Add repeatable build, lint, and test command entry points for the new source roots. <!-- authority: human-confirmed -->
- Record preview-only verification and secret-handling constraints near the application workspace. <!-- authority: llm-explicit -->

### Out of scope

- Reuse, copy, or patch the inherited application implementation. <!-- authority: human-confirmed -->
- Implement authentication, database entities, portal pages, payments, integrations, or migrations. <!-- authority: llm-explicit -->
- Push, deploy, promote, add credentials, or alter legacy production data. <!-- authority: human-edited -->

## Dependencies

This is the first greenfield task and has no application-task dependency. It unblocks all subsequent rebuild tasks through its source roots and quality-command baseline. <!-- authority: llm-implicit -->

The documented private-repository, secret-isolation, and preview-verification rules remain binding. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Codex converted the approved handoff documentation and operator rebuild decision into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent endpoint contracts, database fields, credentials, or deployment access. <!-- authority: llm-explicit -->
- Human review: The operator approved the task-author plan before task drafting began. <!-- authority: human-confirmed -->
