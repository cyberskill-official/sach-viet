---
id: TASK-INSTITUTION-002
title: "Deliver MARC records for purchased titles"
template: task@1
type: feature
module: institution
author: "@codex"
department: engineering
status: closed
entered_via: audit
priority: p1
created_at: "2026-07-23T05:54:52Z"
ai_authorship: assisted
eu_ai_act_risk_class: not_ai
client_visible: false
depends_on:
  - TASK-B2B-002
source_ref:
  - docs/01-vision.md:16-18
  - docs/03-portals.md:48-50
  - docs/05-data-model.md:41-52
  - docs/README.md:21-25
provenance:
  - "closed_as_superseded: TASK-REBUILD-015 on 2026-07-24 (operator session judgment; see docs/tasks/rebuild/.workflow/on-hold-supersession-2026-07-24.md)"
  - "source_path: docs/01-vision.md"
  - "source_hash: 85bd3a7365b7c6ed3eb5dc449e867b08316b23fb2b055db69a0d5ecb8f0cac23"
  - "source_refs: docs/01-vision.md:16-18; docs/03-portals.md:48-50; docs/05-data-model.md:41-52; docs/README.md:21-25"
  - "author_manifest: docs/tasks/.workflow/task-author.sachviet-handoff.manifest.json"
  - "author_manifest_source_hash: f6d8f50dff37660fdf144411c6962e149497894fd20359785c0d01657cc31754"
  - "operator_resolution: approved recommended defaults on 2026-07-23"
---

# Task

## Summary

Deliver a recovered MARC record only when the requesting `school_librarian` has a source-confirmed purchase entitlement for the title in that librarian's own organization. Reuse an existing MARC subsystem and private storage only when discovery confirms both; otherwise record the missing contract and stop. <!-- authority: human-confirmed -->

## Problem

Institution buyers need MARC record delivery for purchased titles, while the B2B service is a broker for institutions and publishers can upload MARC files through the documented MarcParser service. <!-- authority: llm-explicit -->

The handoff does not define purchase entitlement, MARC ownership, delivery format, access policy, storage policy, serialization, or a third-party catalog integration. A delivery task must therefore protect organization isolation and reuse only proven existing behavior. <!-- authority: human-confirmed -->

## Proposed Solution

After `TASK-B2B-002` recovers the purchase relation, determine whether the requester belongs to the organization entitled to the purchased title. If the application source establishes a private MARC record and delivery path, expose that existing path solely to the entitled organization's `school_librarian`; do not create an alternative format, public link, or integration. <!-- authority: human-confirmed -->

If discovery cannot confirm the entitlement rule, the MARC record store, private delivery mechanism, or ownership rights, record the evidence gap for an owner decision and do not release a record. <!-- authority: human-confirmed -->

## Alternatives Considered

Generate or serialize a new MARC download format. This was rejected because the sources establish an upload parser but do not establish a delivery format or serialization contract. <!-- authority: llm-explicit -->

Publish a shareable URL or send records to a third-party catalog service. This was rejected because neither public access nor third-party delivery is source-confirmed, and either would weaken the broker's organization boundary. <!-- authority: human-confirmed -->

## Success Metrics

Primary metric - baseline: the institution portal needs MARC delivery for purchased titles, but the handoff has no confirmed entitlement or delivery contract. Target: an entitled `school_librarian` can reach only a source-confirmed private MARC record for a purchased title in that librarian's organization, or the system records a bounded evidence gap. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

Guardrail - baseline: MARC upload and parsing are documented, but public links, serialization, third-party catalog delivery, and storage policy are absent. Target: no record becomes public, is newly serialized, or is sent to a third party through this task. Deadline: before this task moves from testing to done. <!-- authority: human-confirmed -->

## Scope

The scope is an entitlement-gated institutional delivery view over a recovered existing MARC subsystem. It makes no claim about the provenance, rights, retention, format, or delivery behavior that the sources do not establish. <!-- authority: human-confirmed -->

### In scope

- Recover the purchase relation, organization association, requester role guard, MARC record location, and existing private delivery mechanism. <!-- authority: llm-explicit -->
- Gate record access on source-confirmed purchase entitlement and the requester's own organization. <!-- authority: human-confirmed -->
- Reuse existing MARC storage and delivery behavior only after discovery confirms it. <!-- authority: human-confirmed -->
- Record an evidence gap and seek an owner decision when entitlement, storage, private delivery, or ownership is not established. <!-- authority: human-confirmed -->

### Out of scope

- Create a public URL, new MARC serialization, new export format, third-party catalog integration, or email delivery. <!-- authority: human-confirmed -->
- Grant cross-organization access or infer purchase entitlement from an unverified relationship. <!-- authority: human-confirmed -->
- Define copyright, license, ownership, retention, or rights-management policy. <!-- authority: human-confirmed -->
- Run the application locally, commit credentials, or deploy without operator instruction. <!-- authority: human-edited -->

## Dependencies

`TASK-B2B-002` must recover the accepted quote-to-order or purchase relation that can establish entitlement before this task is implemented. A request may not bypass that relation. <!-- authority: human-confirmed -->

The application source must establish a private MARC storage and delivery path. If it does not, the task ends with an evidence record and an owner decision request rather than a new storage design. <!-- authority: human-confirmed -->

The project constraints against local application execution, committed secrets, and unapproved deployment remain binding. <!-- authority: human-edited -->

## AI Authorship Disclosure

- Tools used: Codex assisted with converting handoff documentation and approved defaults into this task. <!-- authority: human-confirmed -->
- Scope: The task does not invent entitlement, MARC ownership, a file format, public access, serialization, third-party delivery, or storage policy that the source does not establish. <!-- authority: llm-explicit -->
- Human review: An operator must review the task before implementation begins, including any ownership, rights, retention, or delivery-format decision. <!-- authority: human-edited -->
