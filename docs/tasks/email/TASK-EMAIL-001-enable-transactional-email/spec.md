---
id: TASK-EMAIL-001
title: "Enable transactional email flows"
template: task@1
type: feature
module: email
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p1
created_at: "2026-07-23T05:52:00Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-DISCOVERY-001
source_ref:
  - docs/03-portals.md:26
  - docs/06-tech-stack.md:29-35
  - docs/06-tech-stack.md:52-57
  - docs/07-status-roadmap.md:35
  - docs/README.md:21-25
provenance:
  - "source_path: docs/07-status-roadmap.md"
  - "source_hash: 2104f7ddad7ac430bfa2629d9a2708477e8f3d9e1f4520bbde5545c894ff9fb3"
  - "source_refs: docs/03-portals.md:26; docs/06-tech-stack.md:29-35,52-57; docs/07-status-roadmap.md:35; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Enable only source-confirmed transactional email flows after the owner supplies SMTP access through an approved secret channel and approves a preview mailbox. Do not create a sender identity, choose a provider, send to production recipients, or alter production email configuration in this task. <!-- authority: human-confirmed -->

## Problem

The storefront documentation says email flows are blocked on SMTP credentials, while the roadmap says templates exist and SMTP credentials are an owner blocker. <!-- authority: llm-explicit -->

The handoff does not provide SMTP credentials, sender identity, provider selection, recipient policy, template inventory, delivery endpoints, or production authorization. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-DISCOVERY-001` identifies the existing template and trigger paths, accept SMTP access only through the owner-approved secret channel and use it only with an owner-approved preview mailbox. Verify source-confirmed transactional triggers and template rendering without placing credentials, recipient addresses, or message content in task artifacts. <!-- authority: human-confirmed -->

If a credential, preview mailbox, source-confirmed template, or trigger is absent, record the access or evidence gap and leave outbound email disabled. No production recipient, sender setup, provider account, or deployment action is permitted by this task. <!-- authority: human-confirmed -->

## Alternatives Considered

Create a new SMTP provider account. This was rejected because credentials, spending, and provider actions require owner involvement, and the task has no source-confirmed provider choice. <!-- authority: llm-explicit -->

Send a production message to prove delivery. This was rejected because the approved default limits verification to an owner-approved preview mailbox and does not authorize production email. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: email templates are reported to exist, but email flows are blocked on owner-provided SMTP credentials. Target: approved preview verification records source-confirmed template and trigger outcomes without exposing credentials or sending to production recipients. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff does not define a sender, provider, recipient policy, or production deployment. Target: no sender identity, provider account, credential value, production recipient, or production configuration is created or recorded by this task. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is source-confirmed transactional email verification through approved non-production access. It excludes provider selection, sender policy, production delivery, and any template or trigger detail not recovered from source. <!-- authority: llm-explicit -->

### In scope

- Locate existing source-confirmed transactional template and trigger paths after discovery. <!-- authority: llm-explicit -->
- Use owner-supplied SMTP access only through the approved secret channel and only with an owner-approved preview mailbox. <!-- authority: human-confirmed -->
- Verify recovered template rendering and transactional trigger behavior without copying credentials, recipient data, or message content into task artifacts. <!-- authority: human-confirmed -->
- Record missing access, template, trigger, or preview-mailbox evidence instead of inventing a delivery result. <!-- authority: human-confirmed -->

### Out of scope

- Select a mail provider, create a sender identity, spend money, or create a provider account. <!-- authority: human-confirmed -->
- Send email to production recipients, customers, staff, vendors, institutions, publishers, or authors. <!-- authority: human-confirmed -->
- Commit secrets, deploy, or change production email configuration without a separate operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-DISCOVERY-001` must identify the existing template and trigger paths, or record each unavailable, before implementation starts. <!-- authority: human-confirmed -->

Owner-supplied SMTP access and an owner-approved preview mailbox are execution preconditions. They must remain outside the repository and task artifacts. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent a mail provider, sender, credential, recipient, template, trigger, policy, or production authorization that recovered source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins. <!-- authority: human-edited -->
