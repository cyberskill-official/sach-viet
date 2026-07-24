---
id: TASK-REBUILD-006
title: "Build customer support features"
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
  - TASK-REBUILD-004
source_ref:
  - docs/03-portals.md:9-26
  - docs/04-roles-permissions.md:61-79
  - docs/05-data-model.md:55-62
provenance:
  - "source_path: docs/03-portals.md"
  - "author_manifest: docs/tasks/rebuild/.workflow/task-author.sachviet-rebuild.manifest.json"
---

# Task

## Summary

Build customer support tickets, ticket messages, product reviews, and goods requests in the greenfield Next.js application. <!-- authority: human-confirmed -->

## Problem

The rebuilt application has catalog and checkout foundations but no customer-owned support record, review, or request flow. The source requires policy-gated support tickets, verified-purchase reviews, and goods requests. <!-- authority: llm-explicit -->

## Proposed Solution

Add SQLite records and authenticated routes for customer-created tickets, messages, reviews, and goods requests. Enforce record ownership for customers and queue access for staff. Preserve an internal notification event without sending Zalo or email. <!-- authority: human-confirmed -->

## Alternatives Considered

Send support requests directly to Zalo or email. This is deferred because integration credentials and delivery policy belong to Task 19. <!-- authority: human-confirmed -->

## Scope

This task adds support-domain records and access rules. It does not connect Zalo, SMTP, external helpdesk software, automated moderation, or live notifications. <!-- authority: llm-explicit -->

### In scope

- Customer-owned support tickets and messages. <!-- authority: human-confirmed -->
- Customer goods requests linked to catalog context when available. <!-- authority: llm-explicit -->
- Product reviews marked verified only after a paid order item proves purchase. <!-- authority: human-confirmed -->
- Server-side customer ownership and staff queue access. <!-- authority: human-confirmed -->

### Out of scope

- Zalo, email, SMS, third-party helpdesk delivery, or real-time notification delivery. <!-- authority: human-confirmed -->
- AI moderation, keyword policies, refunds, returns, and fulfillment actions. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - tests prove customers cannot read or write another customer's support records, while authorized staff can use the queue. <!-- authority: human-confirmed -->

Guardrail - tests prove only a paid order item can produce a verified-purchase review. <!-- authority: human-confirmed -->

## Dependencies

Identity provides signed sessions and ownership helpers. Catalog and commerce records provide product and paid-order proof. <!-- authority: llm-implicit -->

## AI Authorship Disclosure

- Tools used: Codex translated the source support requirements into greenfield scope. <!-- authority: human-confirmed -->
- Scope: The task avoids external notification credentials and unspecified moderation policy. <!-- authority: llm-explicit -->
- Human review: The operator approved recommended defaults and routine acceptance gates for this session. <!-- authority: human-confirmed -->
