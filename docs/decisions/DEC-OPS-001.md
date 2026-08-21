---
id: DEC-OPS-001
title: Release owners, rollback, on-call, availability, and cost limits
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-21"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
  - docs/ops/next-dec-revisions-checklist-2026-08-21.md
  - docs/ops/production-execute-status-2026-07-26.md
blocks:
  - staging exit
  - production exit
  - PKG-03 US-region move
---

# DEC-OPS-001

**Interim owner defaults 2026-08-21** — revisable. Supersedes interim-defaults-2026-08-20.

**Stay APAC**, `sv_session`, public schema, WP DNS refused. Storage mode remains **postgres** (BYTEA / registry metadata) until a dedicated Storage cutover package.

## Authority (owners fill)

| Role       | Name                           | Date       | Signature                         |
| ---------- | ------------------------------ | ---------- | --------------------------------- |
| Owner      | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |
| Operations | CyberSkill operator (interim)  | 2026-08-21 | interim-owner-defaults-2026-08-21 |

## Fields to accept (owners fill; leave blank until signed)

| Field               | Accepted value | Notes |
| ------------------- | -------------- | ----- |
| Release approver    | **CyberSkill operator** (HITL; never merge/deploy without explicit operator instruction). | AGENTS.md. |
| Migration operator  | **CyberSkill operator**; public schema runner. | Private `app` deferred. |
| Rollback authority  | **CyberSkill operator**; Vercel previous deployment / named rollback docs. | — |
| On-call owner       | **CyberSkill operator (interim)** until named rotation. | — |
| Incident channel    | **Operator’s primary CyberSkill channel** (status hub + chat). | — |
| Availability target | **Deferred — no SLO %.** Best-effort Production. | — |
| Traffic forecast    | **Deferred — no numeric forecast.** | — |
| Monthly cost limits | **Deferred — no $ cap.** Current Vercel + Supabase tiers. | — |
| Region / topology   | **Stay Supabase APAC `eskazygpnygqsrcwlszz`.** US-region **deferred**. Hosting: Vercel. | Explicit non-move. |
| Identity / schema   | **Keep `sv_session`.** **Keep public schema.** Auth / `app` cutovers deferred. | — |
| Storage mode        | **postgres** (BYTEA + `007` registry metadata) until Storage cutover package. | Not a live Storage go. |
| WordPress DNS       | **Refused / deferred.** | — |

## Accepted values

**Version:** interim-owner-defaults-2026-08-21  
**Topology:** Vercel + Supabase APAC `eskazygpnygqsrcwlszz`; US **deferred**.  
**Identity:** `sv_session`.  
**Schema:** public.  
**Storage:** postgres until cutover package.  
**WP DNS:** refused.  
**People:** CyberSkill operator interim.  
**SLO / cost / traffic:** deferred.

## Explicit non-values

Do not invent SLO %, cost caps, or treat this as approval for US move, Supabase Auth, `app` schema, or WP DNS.

## History

- **2026-08-20:** APAC stay; Auth/`app` deferred; WP refused.
- **2026-08-21:** interim-owner-defaults — reaffirm; note Storage mode postgres until cutover.
