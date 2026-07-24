---
id: TASK-REBUILD-011
title: "Define and build live notifications"
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
  - TASK-REBUILD-010
source_ref:
  - docs/03-portals.md:62-68
  - docs/06-tech-stack.md:29-35,43-50
  - docs/07-status-roadmap.md:29-36
provenance:
  - "source_path: docs/03-portals.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
  - "transport_decision: authenticated SSE for greenfield Next.js live push"
---

# Task

## Summary

Define authenticated Server-Sent Events as the greenfield live-notification transport, then build a signed-session SSE stream that pushes owner-scoped inbox events and unread badge updates on top of the Task 10 notification repository in `app/web`. <!-- authority: human-confirmed -->

## Problem

Task 10 shipped the in-app notification inbox, unread badge, deeplink fields, event-type registry, and preference/channel gates, but the source still marks real-time delivery as not built. The tech-stack notes call for live push when the notification bell needs updates instead of poll-only refresh, while listing Reverb, Pusher, and polling as legacy-stack options. Email and Zalo remain separate later work. <!-- authority: llm-explicit -->

## Proposed Solution

Record the greenfield transport decision as authenticated Server-Sent Events over a Next.js route handler. Add a live-notification module that reuses the Task 10 SQLite notification store without changing preference or channel policy. Expose `GET /api/notifications/stream` under a signed session so only the authenticated owner receives events for their own inbox. On successful `createNotification` persistence, publish a live event carrying notification id, event type, title, body, deeplink path, unread count, and a monotonic cursor. Support cursor resume so a reconnecting client receives only newer owner-scoped notifications. Keep a short heartbeat so clients can detect a stalled stream. Emit safe structured events that omit session tokens, email addresses, request bodies, and payment secrets. Do not introduce Pusher credentials, Laravel Reverb, WebSocket servers, email, Zalo, or SMS send paths. <!-- authority: human-confirmed -->

## Alternatives Considered

Adopt Laravel Reverb. This is rejected because the active rebuild is greenfield Next.js, not the legacy Laravel API stack. <!-- authority: human-confirmed -->

Adopt Pusher or another paid push provider. This is rejected for this task because owner credentials and spend are blockers, and the source already allows a self-hosted live path. <!-- authority: human-confirmed -->

Ship poll-only badge refresh as the primary live surface. This is rejected because the source upgrades away from poll when the bell needs live push, and Task 10 already covers pull reads. <!-- authority: llm-explicit -->

Send email, Zalo, SMS, or browser-push from this stream. This is deferred because external channels belong to Task 19 after credentials exist. <!-- authority: llm-explicit -->

Recover a legacy Nuxt/Laravel realtime bus. This is rejected under the greenfield-only rebuild decision. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: Task 10 provides pull inbox reads only; no live owner stream exists. Target: tests prove a signed-in user can open an authenticated SSE stream, receive a live event when a preference-allowed notification is created for them, resume from a cursor without replaying older foreign or already-seen items, and see unread-count updates on the stream. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: live transport must stay owner-scoped and free of external messaging or paid push dependencies. Target: tests prove unauthenticated callers cannot open the stream, one user cannot subscribe to another user's notifications, responses and structured events omit session tokens, email addresses, request bodies, and payment secrets, and the implementation introduces no Pusher, Reverb, SMTP, Zalo, or SMS send path. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

This task defines SSE as the greenfield live transport and builds the authenticated owner stream plus publish hook on Task 10's inbox. It does not invent external messaging or deployment. <!-- authority: llm-explicit -->

### In scope

- Explicit transport decision: authenticated SSE for greenfield Next.js live notifications. <!-- authority: human-confirmed -->
- Signed-session `GET /api/notifications/stream` that emits owner-scoped notification and unread-count events. <!-- authority: human-confirmed -->
- Publish hook from successful notification creation into the live bus, with cursor resume and heartbeat. <!-- authority: human-confirmed -->
- Tests and a source verify script proving auth, ownership, cursor resume, and secret omission. <!-- authority: llm-explicit -->

### Out of scope

- Email, Zalo, SMS, SMTP, browser-push providers, or template rendering. <!-- authority: human-confirmed -->
- Pusher accounts, Laravel Reverb, dedicated WebSocket infrastructure, or multi-node broker clustering. <!-- authority: human-confirmed -->
- Changing Task 10 preference/channel policy, event-type registry contents, or legacy recovery. <!-- authority: llm-explicit -->
- Deployment, CapRover rollout, or Cloudflare configuration. <!-- authority: llm-explicit -->

## Dependencies

Task 10 provides the notification repository, preference gates, unread badge, and mark-read surfaces this live stream rides on. Later Task 19 may add email and Zalo channels after credentials exist. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented real-time notification gap and greenfield stack constraints into this task. <!-- authority: human-confirmed -->
- Scope: The task defines SSE live push on the Task 10 inbox and excludes paid push providers, Reverb, and external messaging. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue, routine acceptance gates, and assigned live transport to Task 11 while leaving email/Zalo deferred. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-011.*
