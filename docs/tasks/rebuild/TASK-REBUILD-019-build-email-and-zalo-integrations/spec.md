---
id: TASK-REBUILD-019
title: "Build email and Zalo integrations"
template: task@1
type: feature
module: rebuild
author: "@codex"
department: engineering
status: done
shipped: "2026-07-24"
priority: p0
created_at: "2026-07-24T00:00:00+07:00"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
target_release: ""
client_visible: false
depends_on:
  - TASK-REBUILD-002
  - TASK-REBUILD-010
source_ref:
  - docs/03-portals.md:9-34
  - docs/05-data-model.md:55-62
  - docs/06-tech-stack.md:52-57
  - docs/07-status-roadmap.md:29-36
provenance:
  - "source_path: docs/06-tech-stack.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
  - "operator_resolution: greenfield-only rebuild on 2026-07-24"
  - "channel_decision: adapter interfaces with recording stubs; optional env-gated SMTP and Zalo OA transports"
  - "related_on_hold: docs/tasks/email/TASK-EMAIL-001-enable-transactional-email (leave on_hold)"
  - "related_on_hold: docs/tasks/integrations/TASK-INTEGRATIONS-001-complete-admin-integrations (leave on_hold)"
---

# Task

## Summary

Build greenfield email and Zalo notification-channel adapters on top of the Task 10 inbox in `app/web`, with recording stubs as the default so CI and local runs work without live credentials, optional env-gated SMTP and Zalo OA transports, preference/channel gates for `email` and `zalo`, and delivery-attempt records that never store secrets. <!-- authority: human-confirmed -->

## Problem

Tasks 10 and 11 shipped in-app notifications and authenticated SSE live push, but external channels remain deferred. The source names email flows (templates exist; SMTP credentials are an owner blocker), Zalo OA as an `Integration` surface, goods-request Zalo jobs in the legacy handoff, and owner gates for any credential, spend, or outbound activation. Non-rebuild `TASK-EMAIL-001` and `TASK-INTEGRATIONS-001` stay on hold under the greenfield-only decision and must not be reopened. <!-- authority: llm-explicit -->

Greenfield has no email/Zalo adapter module, no `email`/`zalo` channel records beyond Task 10's `in_app` channel, and no delivery-attempt trail. Locking the platform to a paid email SaaS (Resend, SendGrid, Mailgun, and similar) would invent an irreversible vendor commitment the sources do not authorize. Inventing production secrets or sending to real recipients without owner credentials would violate the tech-stack owner blockers. <!-- authority: human-confirmed -->

## Proposed Solution

Add an `email-zalo-integrations-core` module (or equivalent) in `app/web` that defines closed adapter interfaces for email and Zalo transports. Default both transports to recording/stub adapters that accept dispatch requests, append delivery-attempt rows, emit safe structured events, and never open a network socket. When an authorized deployment supplies non-secret configuration through environment variables, optionally enable: (a) a vendor-agnostic SMTP transport for email; (b) a Zalo Official Account HTTP transport for Zalo. Do not hard-code a paid email SaaS SDK, API base URL brand, or account signup as the platform default. <!-- authority: human-confirmed -->

Extend Task 10 `user_channels` so signed-in users may enable or disable `email` and `zalo` channels in addition to the existing `in_app` channel, without weakening in-app or SSE behavior. Persist an append-only `notification_delivery_attempts` (or equivalent) trail keyed by notification id, channel (`email` | `zalo`), outcome (`recorded` | `sent` | `skipped` | `failed`), and timestamps. Attempts MUST omit session tokens, raw email addresses, Zalo access tokens, SMTP passwords, request bodies, and payment secrets from stored rows and structured events (redact or hash recipient identifiers if an identifier is required for correlation). <!-- authority: llm-explicit -->

Wire channel dispatch after a successful preference-allowed `createNotification` persistence (or an explicit post-create hook that reuses the same notification id) so enabled external channels receive the notification title/body/deeplink payload through the adapters. Preference or channel-disabled states MUST record `skipped` without calling a live transport. Missing credentials MUST keep the recording stub active and MUST NOT invent secrets or fail the in-app create path. Expose a signed-session admin-only integration status read that reports whether each adapter is stub or live-configured using non-secret flags only (for example `emailTransport: "recording" | "smtp"`, `zaloTransport: "recording" | "zalo_oa"`, credentialPresence booleans) — never secret values. Leave Task 10/11 notification and SSE cores intact aside from the minimal hook and channel-preference extensions required here. Leave `TASK-EMAIL-001`, `TASK-INTEGRATIONS-001`, publisher/author portals, and the royalty activation gate unchanged. <!-- authority: human-confirmed -->

## Alternatives Considered

Commit to Resend, SendGrid, Mailgun, or another paid email SaaS as the platform email vendor. This is rejected because the sources authorize SMTP credentials as an owner blocker without naming a SaaS, and locking a paid vendor is an irreversible platform choice that requires an explicit operator decision. <!-- authority: human-confirmed -->

Require live SMTP and Zalo credentials before the task can pass CI. This is rejected because greenfield CI must remain credential-free; recording stubs are the default and live transports are env-gated. <!-- authority: human-confirmed -->

Send production or preview messages to prove delivery as part of this task. This is rejected because outbound production sends and credential entry remain owner gates; verification is stub/recording behavior plus optional live-transport unit seams without inventing secrets. <!-- authority: llm-explicit -->

Reopen or implement `TASK-EMAIL-001` / `TASK-INTEGRATIONS-001` legacy settings screens. This is rejected under the greenfield-only decision and standing orders to leave non-rebuild `on_hold` tasks alone. <!-- authority: human-confirmed -->

Fold email/Zalo into the SSE stream as browser-push substitutes. This is rejected because Task 11 owns live in-app transport and this task owns external channels. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: greenfield has in-app + SSE notifications only; no email/Zalo adapters, channel toggles, or delivery-attempt trail. Target: tests prove recording stubs dispatch for enabled `email`/`zalo` channels after notification create, disabled channels skip, missing credentials keep stubs without network I/O, optional SMTP/Zalo OA seams activate only when env configuration is present in tests, admin status returns non-secret adapter mode flags, and unauthorized actors cannot read integration status or mutate another user's channels. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: owner blockers forbid inventing secrets, locking a paid email SaaS without decision, and production sends. Target: tests prove no paid email SaaS SDK is introduced as the platform default, no secrets appear in repository artefacts or structured events, delivery-attempt rows omit raw emails/tokens/passwords, Task 10/11 in-app + SSE behavior remains intact, and `TASK-EMAIL-001` / `TASK-INTEGRATIONS-001` / publisher/author / royalty gate artefacts are not mutated for ownership. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

This task establishes adapter-based email and Zalo channels with stub-default delivery on top of Task 10 preferences. It does not choose a paid email SaaS, commit secrets, or send production messages. <!-- authority: llm-explicit -->

### In scope

- Closed email and Zalo transport adapter interfaces with recording/stub defaults. <!-- authority: human-confirmed -->
- Optional env-gated vendor-agnostic SMTP email transport and Zalo OA HTTP transport seams. <!-- authority: human-confirmed -->
- `user_channels` support for `email` and `zalo` toggles without weakening `in_app` or SSE. <!-- authority: human-confirmed -->
- Append-only delivery-attempt records and post-create channel dispatch gated by preferences/channels. <!-- authority: human-confirmed -->
- Admin-only non-secret integration status read for adapter mode / credential-presence flags. <!-- authority: llm-explicit -->
- Core/route tests and a verify script proving stub behavior, skip paths, secret omission, and env-gated seams. <!-- authority: llm-explicit -->

### Out of scope

- Choose or hard-code Resend, SendGrid, Mailgun, Postmark, SES SDK lock-in, or any other paid email SaaS as the platform default. <!-- authority: human-confirmed -->
- Invent, commit, or log SMTP passwords, Zalo access tokens, API keys, or production recipient lists. <!-- authority: human-confirmed -->
- Production outbound sends, preview-mailbox owner verification ceremonies, or CapRover/Cloudflare deployment. <!-- authority: llm-explicit -->
- SMS, browser-push, marketing campaigns, rich HTML template designers, or queue-worker infrastructure beyond inline dispatch. <!-- authority: llm-explicit -->
- Mutate `TASK-EMAIL-001`, `TASK-INTEGRATIONS-001`, publisher/author portals, royalty activation gate, or Task 11 SSE semantics beyond the minimal create-hook needed for channel dispatch. <!-- authority: human-confirmed -->

## Dependencies

Task 2 provides signed sessions and role checks for admin status reads. Task 10 provides the notification repository, event-type registry, preference gates, and `user_channels` foundation this task extends with `email`/`zalo`. Task 11 SSE live push remains intact and is not replaced by external channels. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the documented email/Zalo integration gaps and greenfield credential constraints into this rebuild task. <!-- authority: human-confirmed -->
- Scope: The task builds adapter/stub email and Zalo channels with optional env-gated SMTP and Zalo OA seams; it excludes paid email SaaS lock-in, secret invention, and production sends. <!-- authority: llm-explicit -->
- Human review: The operator approved the greenfield-only queue, session-wide routine acceptance gates, and standing orders to prefer credential-free stubs and to pause only for irreversible vendor choices. <!-- authority: human-confirmed -->

*End of TASK-REBUILD-019.*
