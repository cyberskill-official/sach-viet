---
id: DEC-OPS-001
title: Release owners, rollback, on-call, availability, and cost limits
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-20"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
  - docs/ops/production-execute-status-2026-07-26.md
blocks:
  - staging exit
  - production exit
  - PKG-03 US-region move
---

# DEC-OPS-001

**Interim defaults — owner may revise; supersedes unsigned empty body.**

Codifies **stay on Vercel + Supabase APAC** (`eskazygpnygqsrcwlszz`), custom `sv_session`, **public schema**, and **WordPress DNS refused/deferred**. US-region move, private `app` schema, and Supabase Auth remain **deferred** until dedicated packages. Does not invent fake SLO % or monthly $ caps.

## Authority (owners fill)

| Role       | Name                          | Date       | Signature                   |
| ---------- | ----------------------------- | ---------- | --------------------------- |
| Owner      | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20 |
| Operations | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20 |

## Fields to accept (owners fill; leave blank until signed)

| Field               | Accepted value | Notes |
| ------------------- | -------------- | ----- |
| Release approver    | **CyberSkill operator** (HITL gates per CyberOS; never merge/deploy without explicit operator instruction). | Matches repo AGENTS.md. |
| Migration operator  | **CyberSkill operator**; migrations via existing runner on public schema. | Private `app` schema deferred. |
| Rollback authority  | **CyberSkill operator**; use named rollback / Vercel previous deployment per ops docs. | — |
| On-call owner       | **CyberSkill operator (interim)** until a named rotation is published. | Not a fake pager schedule. |
| Incident channel    | **Operator’s primary CyberSkill channel** (repo/status hub + operator chat). Formal PagerDuty/etc. deferred. | — |
| Availability target | **Deferred — no SLO % accepted yet.** Best-effort Production on Vercel + Supabase. | Override before staging/prod exit claims. |
| Traffic forecast    | **Deferred — no numeric forecast accepted.** | — |
| Monthly cost limits | **Deferred — no $ cap accepted.** Stay on current Vercel + Supabase tiers; revisit before scale events. | — |
| Region / topology   | **Stay Supabase APAC project `eskazygpnygqsrcwlszz`.** **US-region move deferred** (`PKG-03`). Hosting: Vercel. | Explicit non-move. |
| Identity / schema   | **Keep custom `sv_session` until dedicated Auth migration package. Keep public schema until dedicated `app` schema package.** | — |
| WordPress DNS       | **Refused / deferred.** No WP DNS cutover. | — |

## Accepted values

**Version:** interim-defaults-2026-08-20  
**Topology:** Vercel + Supabase APAC `eskazygpnygqsrcwlszz`; US-region **deferred**.  
**Identity:** `sv_session` until Auth package.  
**Schema:** public until `app` schema package.  
**WP DNS:** refused / deferred.  
**People:** CyberSkill operator as interim release / migration / rollback / on-call.  
**SLO / cost / traffic:** deferred — no invented numbers.

## Explicit non-values

Do not invent SLO percentages, cost caps, or treat this as approval for US-region move, Supabase Auth cutover, `app` schema cutover, or WordPress DNS.
