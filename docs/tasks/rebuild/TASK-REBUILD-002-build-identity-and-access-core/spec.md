---
id: TASK-REBUILD-002
title: "Build identity and access control core"
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
depends_on:
  - TASK-REBUILD-001
source_ref:
  - docs/04-roles-permissions.md:3-82
  - docs/05-data-model.md:17-18
  - user decision: full-stack Next.js and recommended defaults
provenance:
  - "source_path: docs/04-roles-permissions.md"
  - "source_hash: 7a14198c45c344d94c4753e3d370e2fe90a5623d455daa5eddce1c84cfa7431d"
  - "operator_resolution: greenfield rebuild on 2026-07-23"
  - "operator_resolution: single full-stack Next.js application on 2026-07-24"
  - "operator_resolution: local credentials and SQLite bootstrap default on 2026-07-24"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
---

# Task

## Summary

Build the shared identity, login, portal-route guard, server authorization, and record-ownership foundation inside the full-stack Next.js application. It must enforce the documented single-role model across later portals. <!-- authority: human-confirmed -->

## Problem

Every portal has distinct allowed roles and protected server routes, while the documented design deliberately uses one role string on each user instead of a generic permission matrix. The greenfield Next.js workspace has no identity or authorization code. <!-- authority: llm-explicit -->

The old handoff implemented login through Laravel Sanctum and a Nuxt proxy. The operator replaced that split stack with one Next.js application, so the same browser security property must be provided by an opaque httpOnly session cookie owned by Next.js. <!-- authority: human-confirmed -->

## Proposed Solution

Implement the documented role set in `app/web` with a SQLite user and session store, email-and-password login, per-email throttling, opaque httpOnly session cookies, server-side role checks, and reusable ownership helpers. Use Node.js built-in SQLite and cryptographic password hashing so the foundation does not need an external identity provider or database service. <!-- authority: human-confirmed -->

Bootstrap the first administrator only when the authorized deployment supplies `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD_HASH`, and `AUTH_SESSION_SECRET` as platform secrets. Do not add secret values, deploy, or create a live administrator in this task. <!-- authority: human-confirmed -->

## Alternatives Considered

Retain Laravel Sanctum and the Nuxt proxy. This is rejected because the operator selected one full-stack Next.js application. <!-- authority: human-confirmed -->

Use OAuth, passwordless email, or an external identity provider. This is deferred because each option requires provider credentials or a delivery service that is not authorized for this foundation. <!-- authority: llm-explicit -->

Migrate WordPress password hashes during this task. This is rejected because the operator chose a rebuild and no legacy migration access or data action is in scope. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: the Next.js application has no identity implementation. Target: every documented role has a server-side access check and unauthorized portal or server access is rejected. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: browser JavaScript must not receive a bearer token or password hash. Target: authentication uses only an httpOnly session cookie and the first-admin inputs are named deployment secrets without committed values. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The task establishes shared access control in the Next.js application. It does not implement portal business workflows, external OAuth, email delivery, supplier scope, or imported WordPress data migration. <!-- authority: llm-explicit -->

### In scope

- Implement the documented role tree and route and server-guard mapping. <!-- authority: llm-explicit -->
- Implement login, logout, per-email throttling, opaque session handling, and unauthorized redirects. <!-- authority: llm-explicit -->
- Create a SQLite user and session store plus first-admin bootstrap support that reads platform secrets only at runtime. <!-- authority: human-confirmed -->
- Establish reusable role and ownership-policy helpers for later domain tasks. <!-- authority: human-confirmed -->
- Add checks for authorized access, unauthorized access, session expiry, and secret-free output. <!-- authority: human-confirmed -->

### Out of scope

- Add a permission matrix, external OAuth providers, email delivery, or unlisted roles. <!-- authority: llm-explicit -->
- Place session values, bearer tokens, passwords, or password hashes in browser JavaScript. <!-- authority: llm-explicit -->
- Supply bootstrap secret values, deploy, or create a live administrator. <!-- authority: human-confirmed -->
- Implement support-ticket, goods-request, or other domain behavior before their tasks. <!-- authority: llm-explicit -->

## Dependencies

TASK-REBUILD-001 provides the full-stack Next.js workspace, Node 24 runtime, container package, and quality-command baseline. The role mapping in the handoff remains the role authority for this task. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented role contract and approved Next.js architecture into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent role names, provider credentials, bootstrap values, external identity contracts, or legacy migration access. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield authoring plan, selected full-stack Next.js, and approved recommended defaults. <!-- authority: human-confirmed -->
