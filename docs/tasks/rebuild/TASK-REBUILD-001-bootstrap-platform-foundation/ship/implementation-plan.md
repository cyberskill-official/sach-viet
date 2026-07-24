---
template: implementation-plan@1
title: "Full-stack Next.js platform foundation implementation plan"
plan_version: 1.1.0
linked_task: TASK-REBUILD-001
target_sprint: batch-12-platform-foundation
target_proj_backend: none
total_estimate_pts: 1
author: "@codex"
reviewer: "@codex"
created_at: "2026-07-24T00:00:00Z"
last_updated_at: "2026-07-24T00:00:00Z"
provenance:
  source_path: docs/tasks/rebuild/TASK-REBUILD-001-bootstrap-platform-foundation/spec.md
  source_hash: 971d82b53099cacb565eec176833a256fb7acd52de8b04b95012c13ee6e650ff
  planning_input: operator-selected full-stack Next.js direction
ai_authorship: assisted
---

## 1. Summary

Create the source-controlled full-stack Next.js foundation under `app/web`, with packaging, a non-runtime verifier, and quality commands only. The plan excludes product behavior, a separate API package, credentials, deployment, and all legacy application code. <!-- source_ref: docs/tasks/rebuild/TASK-REBUILD-001-bootstrap-platform-foundation/spec.md:32-72; authority: human-confirmed -->

## 2. Tasks

| ticket_id | title | estimate_pts | owner | blocked_by | acceptance_link |
| --- | --- | --- | --- | --- | --- |
| IMPL-PLAN-001 | Scaffold the TypeScript, React, and Next.js App Router source root | 1 | @codex | None | TASK-REBUILD-001 Summary and In scope |
| IMPL-PLAN-002 | Add non-runtime verifier, Node tests, coverage command, and dependency audit | 0 | @codex | IMPL-PLAN-001 | TASK-REBUILD-001 Success Metrics |
| IMPL-PLAN-003 | Add standalone Docker and CapRover packaging without deployment | 0 | @codex | IMPL-PLAN-001 | TASK-REBUILD-001 Guardrail |

The one-point estimate is the operator-authorized recommended default for this self-contained foundation task. It is a planning input, not a delivery or cost target. <!-- source_ref: operator recommended-default instruction; authority: human-confirmed -->

## 3. Branch and PR strategy

Implement on `codex/batch/12-platform-foundation`, keep all task changes on this batch branch, and do not push, merge, or deploy. A later reviewer may create a review request after local quality gates pass. <!-- source_ref: AGENTS.md; authority: human-edited -->

## 4. Test strategy

Use Node test runner coverage in `app/web/tests/foundation.test.mjs` for package metadata, required files, the Next.js-only boundary, packaging definition, environment-file rejection, and redacted verifier events. Run `npm run lint`, `npm run test:coverage`, `npm run verify`, `npm run build`, and `npm audit --audit-level=high` as one-shot commands. <!-- source_ref: docs/tasks/rebuild/TASK-REBUILD-001-bootstrap-platform-foundation/ship/edge-case-matrix.md:9-83; authority: llm-explicit -->

Build the production image with `docker build --tag sachviet-web-foundation:local app/web`. Do not start a local application process or deploy the image. <!-- source_ref: app/web/OPERATIONS.md:15-30; authority: human-edited -->

## 5. Observability

The non-runtime verifier writes structured JSON lifecycle events for start, successful completion, and failure. The failure event has a fixed check id and error class, and does not carry a filesystem path, environment value, token, or credential. <!-- source_ref: app/web/scripts/verify-foundation.mjs:16-17,59-70; authority: llm-explicit -->

The foundation has no application request path, external I/O, database action, subject identifier, or product state transition. Runtime telemetry is deferred to the task that introduces runtime behavior. <!-- source_ref: docs/tasks/rebuild/TASK-REBUILD-001-bootstrap-platform-foundation/spec.md:54-72; authority: llm-explicit -->

## 6. Rollout

feature_flag: not_applicable

The task creates no preview deployment, production release, or credential. Browser acceptance belongs to an authorized preview deployment in a later release step. <!-- source_ref: app/web/OPERATIONS.md:24-30; authority: human-edited -->

## 7. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A build dependency ships a high-severity advisory. | Pin the generated lockfile, apply supported package overrides, and run npm audit at high severity. |
| A later contributor adds a separate API package or legacy source. | Make the verifier reject `app/api` and state the single-package boundary in the workspace documentation. |
| A credential is introduced during setup. | Ignore environment files, test the redacted failure path, and add no values to source control. |
| A preview package is malformed. | Validate the CapRover definition and build the Docker image without deploying it. |

## 8. AI tool usage

Codex created and reviewed this greenfield foundation with the operator's architecture decision. Human review remains required before remote publication or release action. <!-- source_ref: docs/tasks/rebuild/TASK-REBUILD-001-bootstrap-platform-foundation/spec.md:74-78; authority: human-confirmed -->

## 12. Security review checklist

- No credential, environment value, or production URL is committed. <!-- source_ref: app/.gitignore:1-9; authority: human-edited -->
- React 19.2.4 and Next.js 16.2.11 are pinned, and npm audit reports no high or critical finding. <!-- source_ref: app/web/package.json:13-28; authority: llm-explicit -->
- The foundation adds no browser-side bearer token, authentication contract, or public endpoint contract. <!-- source_ref: docs/tasks/rebuild/TASK-REBUILD-001-bootstrap-platform-foundation/spec.md:62-70; authority: human-confirmed -->

## 13. AI-generated code review plan

Review the diff for the single `app/web` boundary, ignored secret files, no legacy source, correct standalone packaging, and tests that cover both successful and failing verifier paths. Confirm no deployment or credential action appears in the diff. <!-- source_ref: docs/tasks/rebuild/TASK-REBUILD-001-bootstrap-platform-foundation/ship/edge-case-matrix.md:9-83; authority: llm-explicit -->
