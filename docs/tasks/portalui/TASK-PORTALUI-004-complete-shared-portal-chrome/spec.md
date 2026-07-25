---
id: TASK-PORTALUI-004
title: "Complete shared role-aware portal chrome"
template: task@1
type: feature
module: portalui
author: "@cursor"
department: engineering
status: done
priority: p0
created_at: "2026-07-25T02:51:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-PORTALUI-001
  - TASK-REBUILD-002
  - TASK-REBUILD-010
  - TASK-REBUILD-011
source_ref:
  - operator request: shared portal chrome, notifications, SSE, vi/en, states
  - app/web/src/app/api/auth/me/route.ts
  - app/web/src/app/api/notifications
  - app/web/src/components/portal-shell.tsx
---

# Task

## Summary

Complete the shared authenticated shell with role-specific navigation, active-route context, locale and theme controls, a live notification bell and inbox, and reusable loading, empty, error, and policy-pending states. <!-- authority: human-confirmed -->

## Problem

The existing portal shell exposes only an overview link, language toggle, and theme selector. It does not guide each role through its available workflows, and the implemented notification list, read mutation, preferences, and SSE stream have no complete UI surface. <!-- authority: human-confirmed -->

## Proposed Solution

Introduce a role-aware navigation registry consumed by one responsive shell, resolve labels from the existing vi/en catalog, and add a notification center that loads the current inbox, updates unread count from SSE, marks items read through the existing route, and reconnects with bounded backoff. Standardize shared state components and render explicit `policyPending` messaging for deferred publisher/author financial surfaces without offering activation controls. <!-- authority: llm-explicit -->

## Alternatives Considered

Duplicate navigation and notification code in each portal page. Rejected because role differences are data and access policy, not separate shell implementations. <!-- authority: llm-explicit -->

Poll notifications continuously. Rejected because an SSE route already exists and should remain the live-delivery contract, with one initial fetch for authoritative state. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - every protected portal renders appropriate navigation and a working notification bell/inbox with current unread state, live updates, read actions, and vi/en labels before this task reaches `done`. <!-- authority: human-confirmed -->

Guardrail - inaccessible role links are absent, SSE reconnect is bounded and cleaned up, notification failures do not break navigation, locale/theme choices persist safely, and `policyPending` never exposes activation or financial mutation controls. <!-- authority: llm-explicit -->

## Scope

This task owns cross-portal chrome and state language; business-page content remains with the portal-specific tasks. <!-- authority: llm-explicit -->

### In scope

- Authenticated user context, role-aware links, responsive desktop/mobile navigation, and logout affordance. <!-- authority: human-confirmed -->
- Notification bell, unread badge, inbox panel, read mutation, deep links, SSE updates, and reconnect/error state. <!-- authority: human-confirmed -->
- Shared loading, skeleton, empty, error, retry, forbidden, and policy-pending components. <!-- authority: human-confirmed -->
- vi/en labels for all shared chrome and state text. <!-- authority: human-confirmed -->
- Tests for role filtering, translation fallback, notification merging, and stream lifecycle. <!-- authority: llm-explicit -->

### Out of scope

- New notification channels or adapter behavior. <!-- authority: llm-explicit -->
- Royalty/earnings activation, payout calculations, or production cutover controls. <!-- authority: human-confirmed -->
- Replacing route-level access enforcement with client-side hiding. <!-- authority: llm-explicit -->

## Dependencies

TASK-PORTALUI-001 supplies the design system. Rebuild 002 supplies identity and role checks; rebuild 010 and 011 supply notification persistence, preferences, and SSE. <!-- authority: llm-explicit -->

## AI Authorship Disclosure

- **Tools used:** Cursor mapped existing shell, access, localization, notification, and SSE contracts. <!-- authority: llm-explicit -->
- **Scope:** The task composes existing capabilities and does not introduce AI behavior. <!-- authority: llm-explicit -->
- **Human review:** The operator requested shared role chrome and required royalty and cutover deferrals to remain locked. <!-- authority: human-confirmed -->
