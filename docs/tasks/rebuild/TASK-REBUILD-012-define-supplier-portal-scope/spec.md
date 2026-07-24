---
id: TASK-REBUILD-012
title: "Define supplier portal scope"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
priority: p0
created_at: "2026-07-24T00:00:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-002
  - TASK-REBUILD-003
source_ref:
  - docs/03-portals.md:1-58
  - docs/04-roles-permissions.md:7-29,47-63
  - docs/07-status-roadmap.md:29-37
provenance:
  - "source_path: docs/04-roles-permissions.md"
  - "source_hash: 7a14198c45c344d94c4753e3d370e2fe90a5623d455daa5eddce1c84cfa7431d"
  - "source_refs: docs/03-portals.md:1-58; docs/04-roles-permissions.md:7-29,47-63; docs/07-status-roadmap.md:29-37"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
  - "related_deferred: docs/tasks/supplier/TASK-SUPPLIER-001-resolve-portal-scope (on_hold; leave unchanged)"
---

# Task

## Summary

Inventory greenfield supplier placeholders and source gaps, then record a bounded decision to defer building a supplier portal until an owner defines product scope. Do not create supplier pages, APIs, accounts, workflows, or access-policy changes in this task. <!-- authority: human-confirmed -->

## Problem

The roles document names `employee_supplier` as a placeholder liaison role and marks supplier API and middleware surfaces as placeholders, while the roadmap lists the supplier portal as not started (role and middleware placeholder only). The nine-portal handoff does not define a supplier portal section with users, pages, or workflows. <!-- authority: llm-explicit -->

The greenfield rebuild already reserves supplier in shared access and portal foundations (`employee_supplier` role, supplier portal ACL map, `/supplier` proxy matcher, supplier accent label) without shipping supplier portal pages or supplier APIs. No source-confirmed supplier user group, data boundary, or business flow exists to implement. <!-- authority: llm-explicit -->

## Proposed Solution

Produce a source-grounded inventory of supplier placeholders in documentation and in the greenfield `app/web` access/foundation layers. Record the operator-aligned default decision: **defer** greenfield supplier portal product work until an owner supplies a defined scope covering intended users, tasks, data boundaries, and authorization. <!-- authority: human-confirmed -->

Keep existing reserved ACL and foundation placeholders unchanged. Do not invent supplier liaison workflows, broker-facing supplier disclosure behavior, or a portal shell beyond the current reservation. If later evidence shows an urgent security issue or active supplier path requirement, route that evidence to a separate reviewed task rather than expanding this scope record into portal construction. <!-- authority: human-confirmed -->

Leave non-rebuild `TASK-SUPPLIER-001` on hold and unchanged. This task is the greenfield rebuild scope record only. <!-- authority: human-confirmed -->

## Alternatives Considered

Build a greenfield `/supplier` portal from the reserved role and accent. This is rejected because the source defines no supplier users, tasks, pages, data model, or business flow. <!-- authority: llm-explicit -->

Remove `employee_supplier`, the supplier portal ACL entry, the `/supplier` proxy matcher, and the supplier accent now. This is rejected because the source does not establish a retire decision, and removing reservations without owner authority invents policy. <!-- authority: llm-explicit -->

Recover or port legacy Nuxt/Laravel supplier middleware and login debt. This is rejected under the greenfield-only rebuild decision; legacy `TASK-SUPPLIER-001` remains on hold separately. <!-- authority: human-confirmed -->

Treat supplier scope as identical to vendor, publisher, or author portals. This is rejected because those portals have documented product surfaces, while supplier remains a placeholder with no portal section in the nine-portal list. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: supplier portal is documented as not started; greenfield code reserves role/ACL/proxy/accent without supplier pages or APIs. Target: a written inventory and defer decision identify current placeholders, state implement-or-retire triggers, and confirm no supplier portal product surface was added by this task. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: no source-confirmed supplier workflow or data boundary exists. Target: inspection proves this task creates no supplier account seed, portal page, supplier API route, role-policy change, redirect change, or workflow, and does not mutate `TASK-SUPPLIER-001`. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

This task inventories placeholders and records a deferred product decision for the greenfield rebuild. It excludes portal construction and access changes. <!-- authority: llm-explicit -->

### In scope

- Inventory source-confirmed supplier placeholders in roles, roadmap, and the absence of a supplier section among the nine portals. <!-- authority: llm-explicit -->
- Inventory greenfield reservations in `access.mjs`, `web-foundations.mjs`, and `proxy.ts` without treating them as a shipped portal. <!-- authority: llm-explicit -->
- Record the defer decision and the conditions that require a later implement or retire task. <!-- authority: human-confirmed -->
- Preserve a reviewable decision artefact under this task's `ship/` folder. <!-- authority: human-confirmed -->

### Out of scope

- Create a supplier portal page, layout, dashboard, API, data model, seed account, notification event, or workflow. <!-- authority: human-confirmed -->
- Change role policy, portal ACL membership, proxy matchers, redirects, login behavior, or foundation accents. <!-- authority: human-confirmed -->
- Retire or expand `employee_supplier`, recover legacy supplier middleware, deploy, or alter `TASK-SUPPLIER-001`. <!-- authority: human-confirmed -->

## Dependencies

Task 2 provides the single-role access core that already lists `employee_supplier` and a supplier portal ACL reservation. Task 3 provides shared portal foundations that already list a supplier accent label. Later implement or retire work requires a separate owner-approved task with source-confirmed users, workflow, data boundary, and authorization scope. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented supplier placeholder gap and greenfield reservations into this scope task. <!-- authority: human-confirmed -->
- Scope: The task records a defer decision and does not invent supplier users, pages, APIs, data, or access changes. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue and session-wide routine acceptance gates; non-rebuild on-hold supplier work stays untouched. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-012.*
