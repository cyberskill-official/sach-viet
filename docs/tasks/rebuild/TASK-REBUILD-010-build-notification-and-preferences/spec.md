---
id: TASK-REBUILD-010
title: "Build notification and preferences"
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
  - docs/03-portals.md:62-68
  - docs/05-data-model.md:55-62
  - docs/07-status-roadmap.md:20-36
provenance:
  - "source_path: docs/03-portals.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
---

# Task

## Summary

Build the greenfield in-app notification inbox, unread badge count, deeplink targets, notification event-type registry, and per-user plus per-vendor preference/channel records under signed sessions in `app/web`. <!-- authority: human-confirmed -->

## Problem

The greenfield application has identity and portal shells but no shared notification surface. The source identifies notifications as a cross-cutting system for all portals (in-app bell plus preferences), with data-model records for `Notification`, `NotificationEventType` (10+ trigger keys), `UserNotificationPreference`, `VendorNotificationPreference`, and `UserChannel`. Real-time delivery and external email/Zalo channels remain separate later work. <!-- authority: llm-explicit -->

## Proposed Solution

Add a SQLite notification repository and signed-session route handlers in `app/web`. Seed a closed event-type registry of at least ten trigger keys grounded in existing greenfield domains (`order.paid`, `order.payment_failed`, `support.ticket_created`, `support.ticket_message`, `goods_request.created`, `product_review.created`, `vendor.application_submitted`, `vendor.application_decided`, `vendor.offer_written`, `payout.created`, `payout.status_changed`). Persist user-owned inbox notifications with title, body, event type, unread state, and a portal-relative deeplink path. Expose unread badge counts and mark-read for the signed-in owner only. Persist user and vendor notification preferences that gate in-app delivery per event type, plus `UserChannel` records limited to the `in_app` channel in this task. Emit safe structured events that omit session tokens, email addresses, request bodies, and payment secrets. <!-- authority: human-confirmed -->

## Alternatives Considered

Add WebSocket, SSE, Reverb, or Pusher live delivery now. This is rejected because the source and rebuild sequence reserve real-time notifications for Task 11. <!-- authority: human-confirmed -->

Send email, Zalo, SMS, or other external channels from preference toggles. This is deferred because integration credentials and delivery policy belong to Task 19. <!-- authority: llm-explicit -->

Recover or verify a legacy Laravel/Nuxt notification backend. This is rejected under the greenfield-only rebuild decision. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: the greenfield application has no notification inbox, badge count, event-type registry, or preference/channel persistence. Target: tests prove a signed-in user can receive preference-gated in-app notifications, read an unread badge count, mark owned notifications read, update own preferences and the `in_app` channel, a vendor can update vendor preferences, and unauthorized actors cannot read or mutate another user's notification records. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: live transport and external messaging are later tasks, and secrets must stay out of notification payloads and events. Target: tests prove the implementation creates no WebSocket/SSE/Reverb/Pusher transport, no email/Zalo/SMS send path, and omits session tokens, email addresses, request bodies, and payment secrets from responses and structured events. Deadline: before this task moves from testing to done. <!-- authority: llm-explicit -->

## Scope

This task establishes the in-app notification inbox, badge, deeplink fields, event-type registry, and preference/channel persistence under signed sessions. It does not invent live delivery, external messaging, or deployment. <!-- authority: llm-explicit -->

### In scope

- Closed `notification_event_types` registry with at least ten source-grounded trigger keys. <!-- authority: human-confirmed -->
- User-owned `notifications` inbox with unread state and portal-relative deeplink path. <!-- authority: human-confirmed -->
- Unread badge count and mark-read for the signed-in owner only. <!-- authority: human-confirmed -->
- `user_notification_preferences` and `vendor_notification_preferences` that gate in-app creation per event type. <!-- authority: human-confirmed -->
- `user_channels` limited to the `in_app` channel for this task. <!-- authority: llm-explicit -->
- Safe structured events that exclude session tokens, email addresses, request bodies, and payment secrets. <!-- authority: llm-explicit -->

### Out of scope

- Live notification transport (WebSocket, SSE, Reverb, Pusher, or polling push). <!-- authority: human-confirmed -->
- Email, Zalo, SMS, push-provider credentials, template rendering, or SMTP delivery. <!-- authority: human-confirmed -->
- Legacy WordPress/Laravel/Nuxt recovery, multi-tenant fan-out beyond owner/vendor preference gates, or deployment. <!-- authority: llm-explicit -->

## Dependencies

Task 2 provides signed sessions and role normalization. Task 3 provides shared portal foundations used by deeplink paths and portal shells. Later Task 11 may add live delivery on top of this inbox. Later Task 19 may add email and Zalo channels after credentials exist. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented cross-cutting notification gaps and greenfield rebuild sequence into this task. <!-- authority: human-confirmed -->
- Scope: The task excludes live transport, external messaging credentials, and legacy recovery. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue and session-wide routine acceptance gates. <!-- authority: human-confirmed -->
