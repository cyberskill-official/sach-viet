---
id: TASK-REBUILD-002
title: "Build identity and access control core"
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
depends_on:
  - TASK-REBUILD-001
source_ref:
  - docs/02-architecture.md:20-26
  - docs/04-roles-permissions.md:3-82
  - docs/05-data-model.md:17-18
provenance:
  - "source_path: docs/04-roles-permissions.md"
  - "source_hash: 7a14198c45c344d94c4753e3d370e2fe90a5623d455daa5eddce1c84cfa7431d"
  - "operator_resolution: greenfield rebuild on 2026-07-23"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
---

# Task

## Summary

Build the shared identity, login, portal-route guard, API authorization, and record-ownership foundation for the greenfield platform. It must enforce the documented single-role model across every later portal. <!-- authority: human-confirmed -->

## Problem

Every portal has distinct allowed roles and protected API routes, while the documented design deliberately uses one role string on each user rather than a generic permission matrix. The greenfield workspace has no identity or authorization code yet. <!-- authority: llm-explicit -->

The documented auth flow keeps the API token in an httpOnly cookie through the Nuxt proxy. It also requires per-email login throttling, ownership policies for sensitive records, and legacy WordPress password compatibility for imported users. <!-- authority: llm-explicit -->

## Proposed Solution

Implement the source-confirmed user role set, Sanctum-based login flow, Nuxt proxy token handling, frontend portal guards, and API role middleware. Implement the documented ownership-policy pattern only for support-ticket and goods-request records once their domain tasks add those records. <!-- authority: human-confirmed -->

Use the documented role tree and redirects as the authorization contract. Preserve the no-token-in-browser-JavaScript property and reject access outside each portal's allowed roles. <!-- authority: llm-explicit -->

## Alternatives Considered

Use a generic permission package or matrix. This was rejected because the handoff explicitly defines the single-role model as the intended capability structure. <!-- authority: llm-explicit -->

Store bearer tokens in browser JavaScript. This was rejected because the documented Nuxt proxy and httpOnly cookie pattern exists to reduce token exposure. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: the new workspace has no identity or access-control implementation. Target: each documented role has a source-selected login and route-access check, while unauthorized portal and API access is rejected. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff requires browser JavaScript to avoid holding the Sanctum token. Target: the new auth flow keeps the token behind the documented proxy and httpOnly cookie boundary. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

The task establishes the shared access-control foundation. It does not implement portal business workflows, external OAuth, supplier scope, or imported WordPress data migration. <!-- authority: llm-explicit -->

### In scope

- Implement the documented role tree and its route and API guard mapping. <!-- authority: llm-explicit -->
- Implement login, logout, throttling, authenticated proxy handling, and unauthorized redirects. <!-- authority: llm-explicit -->
- Establish reusable role and ownership-policy patterns for later domain tasks. <!-- authority: human-confirmed -->
- Add source-selected checks for authorized and unauthorized access. <!-- authority: human-confirmed -->

### Out of scope

- Add a permission matrix, external OAuth providers, or unlisted roles. <!-- authority: llm-explicit -->
- Place API tokens in browser JavaScript or commit authentication credentials. <!-- authority: llm-explicit -->
- Implement support-ticket and goods-request domain behavior before their task. <!-- authority: llm-explicit -->

## Dependencies

TASK-REBUILD-001 provides the Nuxt and Laravel workspace that this task configures. The role mapping in the handoff is the only role authority for this task. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the approved handoff role and auth contract into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent role names, redirects, API paths, permission policies, or external provider credentials. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield authoring plan before this task was drafted. <!-- authority: human-confirmed -->
