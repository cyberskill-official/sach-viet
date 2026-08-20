# SachViet adjusted completion tracker

**As of:** 2026-08-20  
**Baseline:** current `main` vs [`sachviet-full-production-completion-plan.md`](sachviet-full-production-completion-plan.md)  
**Stack default:** stay on **Vercel + Supabase** (Production project in use). Keep **custom `sv_session` + public schema** until a dedicated migration package is scheduled — do **not** force Supabase Auth or US-region move in Waves 0–3 unless `DEC-OPS-001` / identity DECs require it.

**Blocking prerequisite (updated 2026-08-20):** interim Accepted values landed in all ten `DEC-*` bodies (PR `docs/dec-interim-accepted-defaults`) — **pending operator review**. See [`docs/ops/dec-accepted-values-blocker-2026-08-20.md`](../ops/dec-accepted-values-blocker-2026-08-20.md). **Do not invent rates.** Phase 3 tax/shipping and Phase 5 settlement/royalties / live PV3 still need owner overrides where DECs say deferred or live-refused.

Statuses below mean:

| Status | Meaning |
| --- | --- |
| **done** | Shipped on `main` enough that redoing the package from scratch would be wrong |
| **partial** | Meaningful slice on `main`; package done-criteria not met |
| **remaining** | Not started or only scaffolding; package work still ahead |

## Already on Production / `main` (do not rewrite before golive again)

- Vercel + Supabase APAC project `eskazygpnygqsrcwlszz`
- Custom `sv_session`, public schema, async `pg` pool
- Migrations through `006_portal_search_fulfillment` (`app/web/migrations/001`…`006`)
- Sandbox Stripe / PayPal webhooks and checkout paths
- Resend SMTP wiring
- Nine portal shells under `/(portals)/[portal]` + storefront/account surfaces
- Postgres FTS / portal search (migration `006`)
- Local-complete HITL wave tasks accepted (`docs/ops/hitl-*-local-complete-wave-2026-08-20.md`)

## PKG-* map

| Package | Scope (short) | Status | Notes vs current `main` |
| --- | --- | --- | --- |
| `PKG-00` | Reconcile flows → tasks | **partial** | Local-complete + rebuild tasks exist; full 99-flow task set / production-mode matrix not closed |
| `PKG-01` | Signed DEC Accepted values | **partial** | Interim Accepted values filled (Production policy + explicit deferrals); **operator PR review** before treating as final |
| `PKG-02` | Protect main / CI / HITL / env approvals | **partial** | CyberOS gates + HITL wave done; full release-governance / proving-PR matrix still open |
| `PKG-03` | US-region topology, staging Vercel, fingerprints, backups, obs | **partial** | Vercel + Supabase Production exist (APAC); **US-region move**, dedicated staging topology, obs base gated by `DEC-OPS-001` |
| `PKG-04` | Async `pg` repositories / transactions | **done** | Async pool replaced synckit/child-process path for current domains |
| `PKG-05` | Safe migrations, private `app` schema, expand/contract | **partial** | Runner + migrations through `006` on public schema; **private `app` schema / least-privilege roles remaining** |
| `PKG-06` | Supabase Auth (email/Google/MFA) | **remaining** | Custom session auth in use; Auth migration deferred until dedicated package + DEC |
| `PKG-07` | Orgs, roles, policy, CSRF, rate limits, audit | **partial** | Role shells / basic authz present; full matrix + immutable audit remaining |
| `PKG-08` | Private Supabase Storage | **remaining** | Not delivered as private upload/scan/quarantine lifecycle |
| `PKG-09` | Outbox, jobs, provider ledger, email, Zalo | **partial** | Jobs + Resend + payment webhooks exist; full leased outbox / Realtime / Zalo OA remaining (`DEC-COMMS-001`) |
| `PKG-10` | Retire WP import, supplier, admin AI, CapRover/SQLite | **partial** | Paths largely sidelined; dependency proof / full retirement remaining |
| `PKG-11` | Shared schemas, error envelope, cursors, typed client | **partial** | Some API contracts; not universal across portals |
| `PKG-20` | Home, catalog, FTS, product/offers, wishlist base | **partial** | Storefront + FTS + catalog/product surfaces; completeness vs `FL-B2C-01`…`07` still open |
| `PKG-21` | Quote, reservation, checkout, Stripe/PayPal reconcile | **partial** | Sandbox checkout/webhooks; **tax/shipping/reservation policy blocked** (`DEC-COM-001`); live keys refused (`DEC-PV3-001`) |
| `PKG-22` | Orders, shipment, returns, refunds, timeline | **partial** | Order list/detail + fulfillment fragments; returns/refund allocation **DEC-RET-001** gated |
| `PKG-23` | Reviews, support, goods requests, notifications | **partial** | Support/account shells; depth remaining |
| `PKG-30` | Vendor portal depth | **partial** | Shell + narrow APIs; full `FL-VEN-*` remaining |
| `PKG-31` | Vendor settlement / payouts | **remaining** | Blocked on `DEC-SET-001` |
| `PKG-40` | Admin portal split / depth | **partial** | Shell + partial admin APIs; full `FL-ADM-*` remaining |
| `PKG-41` | Employee + retail depth | **partial** | Shells; queues/fulfillment depth remaining |
| `PKG-50` | B2B + institution pipeline | **partial** | Shells; quote/PO/invoice terms **DEC-B2B-001** gated |
| `PKG-60` | Publisher + author editorial | **partial** | Shells; editorial/rights **DEC-PUB-001** gated |
| `PKG-61` | Royalties / statements | **remaining** | Blocked on `DEC-ROY-001` |
| `PKG-70` | Shared shell, i18n, a11y, privacy exports | **partial** | Portal shell + locale/theme base; WCAG/privacy completeness remaining (`DEC-PRIV-001`) |
| `PKG-71` | Fixtures / seed / verification registry | **partial** | Local/docker smoke seeds; production verification registry remaining |
| `PKG-72` | Full TC matrix harness | **partial** | Unit/smoke/docker evidence for local-complete wave; full `TC-*` release suite remaining |
| `PKG-73` | SAST, a11y, load, backup/restore drills | **partial** | Some ops drills documented; capacity/RPO gates remaining |
| `PKG-80` | Staging full rehearsal | **remaining** | Operator-gated; needs DEC-OPS + domain packages |
| `PKG-81` | Production candidate + live checks | **remaining** | No live Stripe/PayPal; needs `DEC-PV3-001` + operator deploy |
| `PKG-82` | Stabilize + final acceptance | **remaining** | After production candidate |

## Major FL groups (rollup)

| Flow group | Status | Notes |
| --- | --- | --- |
| `FL-PLT-*` | **partial** | Health/ready, shell, email wiring; Storage, audit, privacy, Zalo remaining |
| `FL-ID-*` | **partial** | Register/login/recovery via custom session; Supabase Auth / MFA / privacy deletion remaining |
| `FL-B2C-01`…`05` | **partial** | Storefront/catalog/search/product largely usable |
| `FL-B2C-06`…`12` | **partial / DEC-gated** | Cart/checkout sandbox present; tax/shipping/returns **blocked** |
| `FL-B2C-13`…`14` | **partial** | Support/review surfaces incomplete vs plan |
| `FL-VEN-*` | **partial** | Shells; settlement **DEC-SET** gated |
| `FL-ADM-*` | **partial** | Shells + partial APIs |
| `FL-EMP-*` / `FL-RET-*` | **partial** | Shells; returns policy gated |
| `FL-B2B-*` / `FL-INS-*` | **partial** | Shells; terms gated by `DEC-B2B-001` |
| `FL-PUB-*` / `FL-AUT-*` | **partial** | Shells; editorial/royalty gated by `DEC-PUB-001` / `DEC-ROY-001` |

## Adjusted roadmap phases

| Phase | Focus | Gate |
| --- | --- | --- |
| 0 | CDS Thủy · ocean + auth UI parity | Allowed now (platform UI) |
| 1 | Fill DEC Accepted values in-repo | **Interim filled; operator review of PR** |
| 2 | Foundations delta (Storage, Auth migration plan, `app` schema strategy, observability); defer US-region until `DEC-OPS-001` names it | After Phase 1 for DEC-OPS/PRIV/COMMS as needed |
| 3 | B2C completeness (quote/tax/shipping/reservation, returns) | After `DEC-COM-001`, `DEC-RET-001`; sandbox payments until `DEC-PV3-001` |
| 4 | Portal API depth (`PKG-30`…`60`) under ocean chrome | After domain DECs |
| 5 | Finance — settlement then royalties | After `DEC-SET-001`, `DEC-ROY-001` |
| 6 | Hardening + TC matrix (`PKG-71`…`73`) | After interfaces stabilize |
| 7–9 | Staging / Production evidence / stabilize | Operator-gated; never `sk_live_` until PV3 |

## Explicit non-goals (until DEC says otherwise)

- Inventing tax / shipping / commission / royalty tables
- Live Stripe / PayPal
- WordPress DNS cutover
- Replacing Vercel / Supabase with another host
- Forcing Supabase Auth or US-region move before a dedicated, DEC-aligned migration package

## References

- Full plan: [`sachviet-full-production-completion-plan.md`](sachviet-full-production-completion-plan.md) (§9 packages, §24 decisions)
- DEC blocker: [`../ops/dec-accepted-values-blocker-2026-08-20.md`](../ops/dec-accepted-values-blocker-2026-08-20.md)
- Local-complete HITL: [`../ops/hitl-final-acceptance-local-complete-wave-2026-08-20.md`](../ops/hitl-final-acceptance-local-complete-wave-2026-08-20.md)
