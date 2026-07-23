---
id: TASK-AUTH-001
title: "Align frontend and API role guards"
template: task@1
type: improvement
module: auth
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p1
created_at: "2026-07-23T05:40:18Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/04-roles-permissions.md:26-29
  - docs/04-roles-permissions.md:31-62
  - docs/04-roles-permissions.md:74-80
  - docs/06-tech-stack.md:24-27
  - docs/README.md:21-25
provenance:
  - "source_path: docs/04-roles-permissions.md"
  - "source_hash: 7a14198c45c344d94c4753e3d370e2fe90a5623d455daa5eddce1c84cfa7431d"
  - "source_refs: docs/04-roles-permissions.md:26-29,31-62,74-80; docs/06-tech-stack.md:24-27; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Align `super_admin` authorization with `admin` at every source-confirmed frontend and API guard. The approved default makes `super_admin` an exact alias of `admin`, without widening any other role or changing the authentication flow. <!-- authority: human-confirmed -->

## Problem

The role document says that `admin` is allowed everywhere, while `super_admin` is referenced only in the employee frontend middleware and should be treated as admin. The documented frontend and API guards otherwise list `admin` without `super_admin`. <!-- authority: llm-explicit -->

The application source is absent from this repository, so the exact role representation, guard helpers, redirects, and API middleware must be discovered before any code change. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` locates the guards and role representation, make `super_admin` receive every source-confirmed access decision that `admin` receives and no privilege that `admin` lacks. Apply the same alias rule to the recovered frontend and API guard families. <!-- authority: human-confirmed -->

If recovered source proves that `super_admin` has a distinct business or security meaning, stop and record the conflict instead of collapsing the roles. Preserve all existing non-admin denials, login redirects, policies, token handling, and public-route behavior. <!-- authority: human-confirmed -->

## Alternatives Considered

Keep the current employee-only `super_admin` treatment. This was rejected because the handoff explicitly says to treat the role as admin. <!-- authority: llm-explicit -->

Replace the single-role model with a permission matrix. This was rejected because the handoff describes a single-role capability model and advises retaining it. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: `super_admin` appears only in the employee frontend guard while the role document says to treat it as admin. Target: every source-confirmed privileged frontend and API guard family grants equivalent outcomes to admin and super_admin. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: route guards, policies, and the httpOnly-cookie auth flow are documented security controls. Target: source-selected checks confirm unchanged denial outcomes for unrelated roles and no change to login, token, cookie, or public-route behavior. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope makes one documented role alias consistent across recovered guards. It excludes a role-model redesign, role-assignment changes, and any unrelated authorization work. <!-- authority: llm-explicit -->

### In scope

- Locate source-confirmed frontend guards, API guards, and the role helper or middleware path. <!-- authority: llm-explicit -->
- Apply super_admin-to-admin equivalence only where admin access is already source-confirmed. <!-- authority: human-confirmed -->
- Verify admin and super_admin parity and unchanged denial behavior for unrelated roles. <!-- authority: human-confirmed -->
- Record a security or business conflict if recovered source proves distinct super_admin semantics. <!-- authority: human-confirmed -->

### Out of scope

- Add roles, permissions, role-assignment UI, supplier portal scope, or policy redesign. <!-- authority: llm-explicit -->
- Change login redirects, token handling, cookie handling, public routes, or deployment configuration. <!-- authority: llm-explicit -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the application path, guard implementations, and role representation, or record each unavailable, before implementation starts. <!-- authority: human-confirmed -->

Security review remains required before implementation because this task changes authorization behavior. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a role, permission matrix, redirect, policy, or authentication contract that the recovered source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
