---
id: TASK-B2B-003
title: "Manage B2B contracts and purchase-order artifacts"
template: task@1
type: feature
module: b2b
author: "@codex"
department: engineering
status: ready_to_implement
entered_via: audit
priority: p1
created_at: "2026-07-23T06:00:55Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-B2B-002
source_ref:
  - docs/01-vision.md:16-18
  - docs/03-portals.md:44-46
  - docs/04-roles-permissions.md:43
  - docs/04-roles-permissions.md:58
  - docs/05-data-model.md:41-45
  - docs/README.md:21-25
provenance:
  - "source_path: docs/01-vision.md"
  - "source_hash: 85bd3a7365b7c6ed3eb5dc449e867b08316b23fb2b055db69a0d5ecb8f0cac23"
  - "source_refs: docs/01-vision.md:16-18; docs/03-portals.md:44-46; docs/04-roles-permissions.md:43,58; docs/05-data-model.md:41-45; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Associate a private B2B contract or purchase-order artifact with a recovered quote or order only when the recovered application provides private storage. Limit access to `employee_b2b` and `admin`, and record a storage or entitlement gap instead of creating a public document system. <!-- authority: human-confirmed -->

## Problem

The B2B portal needs contract and purchase-order artifacts, and the B2B brokerage flow is PO-based. The handoff does not define artifact storage, file types, legal templates, retention, organization access, upload flow, signatures, or document-processing behavior. <!-- authority: llm-explicit -->

## Proposed Solution

After `TASK-B2B-002` recovers the quote-to-order context, associate an existing private artifact with a recovered B2B quote or order only when a private storage and staff authorization path is present in the application. Restrict the association to `employee_b2b` and `admin`, preserve the broker boundary, and record missing storage, entitlement, or access evidence as a gap. <!-- authority: human-confirmed -->

Do not create public URLs, institution download access, e-signature, template generation, OCR, document conversion, legal terms, retention policy, or a new file-storage system. A human must separately approve legal and retention requirements before any later scope expansion. <!-- authority: human-confirmed -->

## Alternatives Considered

Build a public contract portal for institutions. This was rejected because the B2B model is staff-operated and the source does not define institution artifact access. <!-- authority: llm-explicit -->

Add document templates, signatures, OCR, or a new storage service. This was rejected because the handoff does not define any of those systems or their legal controls. <!-- authority: llm-explicit -->

## Success Metrics

Primary metric - baseline: contract and PO artifacts are listed as needed but no storage or access design is documented. Target: source-selected checks show that an authorized staff user can associate only an existing private artifact with a recovered B2B quote or order, or that missing private storage or entitlement evidence is recorded as a gap. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: the handoff defines no public access, e-signature, template, OCR, legal, retention, or document-processing behavior. Target: source-selected checks show that the artifact association creates none of those behaviors and stays restricted to `employee_b2b` and `admin`. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is a staff-only association to recovered private storage. It is not a document-management or legal workflow. <!-- authority: llm-explicit -->

### In scope

- Use the quote-to-order context recovered by `TASK-B2B-002` and only a source-confirmed private storage path. <!-- authority: human-confirmed -->
- Associate a recovered contract or PO artifact with a recovered B2B quote or order for `employee_b2b` and `admin`. <!-- authority: human-confirmed -->
- Record absent storage, entitlement, access, or broker-privacy evidence as a gap. <!-- authority: human-confirmed -->

### Out of scope

- Add public URLs, institution downloads, e-signature, templates, OCR, conversion, upload processing, a new storage system, legal terms, or retention policy. <!-- authority: human-confirmed -->
- Change customer, institution, supplier, vendor, or other role permissions. <!-- authority: human-confirmed -->
- Run the application locally, use production artifacts, commit credentials, deploy, or perform a destructive operation without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-B2B-002` must establish the recovered quote-to-order context before this task associates an artifact with a quote or order. <!-- authority: human-confirmed -->

Legal terms, retention, organization entitlement, institution access, and any external document service remain explicit owner decisions outside this task. <!-- authority: human-confirmed -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting the handoff and approved default into this task. <!-- authority: human-confirmed -->
- Scope: The task associates only recovered private artifacts and excludes a legal or document-management system. <!-- authority: llm-explicit -->
- Human review: An operator must approve legal, retention, public-access, or external-service scope before any later expansion. <!-- authority: human-edited -->
