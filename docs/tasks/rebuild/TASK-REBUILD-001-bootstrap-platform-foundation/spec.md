---
id: TASK-REBUILD-001
title: "Bootstrap the greenfield platform foundation"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
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
  - user decision: full-stack Next.js on 2026-07-24
provenance:
  - "source_path: docs/README.md"
  - "source_hash: ee281485ba6c436100e8645d453dd79e8435d695fb02af71f2c4b621a19e3f76"
  - "operator_resolution: greenfield rebuild on 2026-07-23"
  - "operator_resolution: replace Nuxt and Laravel with full-stack Next.js on 2026-07-24"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
---

# Task

## Summary

Create the empty SachViet application workspace as one full-stack Next.js application in `app/web`. It must provide the greenfield UI and server boundary for later work without reusing the inherited implementation. <!-- authority: human-confirmed -->

## Problem

The repository contains handoff documents and CyberOS workflow assets, but no SachViet application source. The operator confirmed that the inherited system must be rebuilt rather than incrementally improved. <!-- authority: human-confirmed -->

The handoff described separate Nuxt and Laravel packages. On 2026-07-24, the operator replaced that direction with one full-stack Next.js application. This task records that superseding decision and creates only the common foundation. <!-- authority: human-confirmed -->

## Proposed Solution

Create `app/web` as a TypeScript, React, Next.js App Router application with a server-rendered foundation page, repeatable build, lint, test, and verification commands, and production Docker and CapRover packaging. Do not create a separate API service in this task. <!-- authority: human-confirmed -->

Keep secrets out of version control. Provide instructions for preview-oriented verification, but do not deploy, add credentials, or start a long-running local application server. <!-- authority: llm-explicit -->

## Alternatives Considered

Adapt the inherited application source. This is rejected because the operator chose a rebuild from scratch. <!-- authority: human-confirmed -->

Retain the earlier Nuxt frontend and Laravel API foundation. This is rejected because the operator explicitly selected Next.js as the single full-stack direction. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: the repository has no source-controlled greenfield application foundation. Target: `app/web` contains a Next.js App Router application with passing `npm run build`, `npm run lint`, `npm run test`, and `npm run verify` commands. Deadline: before this task moves from implementing to ready_to_review. <!-- authority: human-confirmed -->

Guardrail - baseline: project conventions prohibit committed secrets, public repository changes, and local runtime verification as a substitute for preview validation. Target: the foundation contains no credentials, documents preview-oriented verification, and includes a production container build. Deadline: before this task moves from implementing to ready_to_review. <!-- authority: llm-explicit -->

## Scope

The task creates the greenfield Next.js foundation and its quality-command entry points. It does not implement a business portal, database domain, payment flow, external integration, or separate API service. <!-- authority: llm-explicit -->

### In scope

- Create `app/web` as the single full-stack Next.js application source root. <!-- authority: human-confirmed -->
- Add React, TypeScript, App Router, Docker, and CapRover packaging foundations without credentials. <!-- authority: human-confirmed -->
- Add repeatable build, lint, test, and non-runtime verification command entry points. <!-- authority: human-confirmed -->
- Record secret-handling and preview-verification constraints near the application workspace. <!-- authority: llm-explicit -->

### Out of scope

- Reuse, copy, or patch the inherited application implementation. <!-- authority: human-confirmed -->
- Keep or create Nuxt or Laravel application packages. <!-- authority: human-confirmed -->
- Implement authentication, database entities, portal pages, payments, integrations, migrations, or public API contracts. <!-- authority: llm-explicit -->
- Push, deploy, promote, add credentials, alter repository visibility, or alter legacy production data. <!-- authority: human-edited -->

## Dependencies

This is the first greenfield task and has no application-task dependency. It unblocks later rebuild tasks through the Next.js source root and quality-command baseline. <!-- authority: llm-implicit -->

The documented private-repository, secret-isolation, and preview-verification rules remain binding. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Codex converted the approved handoff documentation and operator decisions into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent endpoint contracts, database fields, credentials, or deployment access. <!-- authority: llm-explicit -->
- Human review: The operator approved the task-author plan and later selected Next.js as the implementation direction. <!-- authority: human-confirmed -->
