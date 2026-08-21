# SachViet adjusted completion tracker

**As of:** 2026-08-21  
**Baseline:** `main` @ `3ade640` (DEC owner defaults) + product unlock PR  
**Stack default:** stay on **Vercel + Supabase** (Production project in use). Keep **custom `sv_session` + public schema** until a dedicated migration package is scheduled — do **not** force Supabase Auth or US-region move in Waves 0–3 unless `DEC-OPS-001` / identity DECs require it.

**Hard stop update (2026-08-21 afternoon):** interim **owner defaults** filled (`interim-owner-defaults-2026-08-21`, PR [#40](https://github.com/cyberskill-official/sach-viet/pull/40), merge `3ade640`). Unlocks RET/SET/ROY/B2B/PUB/PRIV product wiring at those rates. **Still blocked:** live PV3, tax>0 / carriers, US/Auth/`app`/WP, Zalo OA. See [`docs/ops/dec-accepted-values-owner-defaults-2026-08-21.md`](../ops/dec-accepted-values-owner-defaults-2026-08-21.md).

**Blocking prerequisite (updated 2026-08-20):** interim Accepted values are on `main` via PR [#35](https://github.com/cyberskill-official/sach-viet/pull/35) (`5df30cd`). Owner revised 2026-08-21 (#40). **Do not invent rates beyond DEC bodies.** Live keys refused (`DEC-PV3-001`).

**Phase 2 foundations delta (TASK-PLT-002):** Storage registry scaffold + Auth/`app` schema plans + probe fingerprints — see [`docs/ops/supabase-storage-scaffolding-2026-08-20.md`](../ops/supabase-storage-scaffolding-2026-08-20.md), [`docs/ops/auth-migration-plan-2026-08-20.md`](../ops/auth-migration-plan-2026-08-20.md), [`docs/ops/app-schema-migration-strategy-2026-08-20.md`](../ops/app-schema-migration-strategy-2026-08-20.md). US-region remains deferred.

**Phase 3 B2C interim (TASK-COM-003):** Server `POST /api/quote` + cart/order UI under DEC-COM interim (USD, tax 0, no shipping, 30m reservation); sandbox payments only; **returns thin policy** from DEC-RET (14d defects). Taxed retail / carriers remain deferred until tax>0 / carrier rates accepted.

**Phase 4 portal depth + hardening slice (TASK-UI-004):** Role portals wired to operational APIs under ocean chrome; **finance compute enabled** from DEC-SET/ROY interim rates; B2B Net-30 / 30d quote validity / admin max 20% discount.

Statuses below mean:

| Status | Meaning |
| --- | --- |
| **done** | Shipped on `main` enough that redoing the package from scratch would be wrong |
| **partial** | Meaningful slice on `main`; package done-criteria not met |
| **remaining** | Not started or only scaffolding; package work still ahead |

## Already on Production / `main` (do not rewrite before golive again)

- Vercel + Supabase APAC project `eskazygpnygqsrcwlszz`
- Custom `sv_session`, public schema, async `pg` pool
- Migrations through `007_storage_object_registry` (`app/web/migrations/001`…`007`) — **applied on Production** 2026-08-21 (`/api/ready` green)
- Sandbox Stripe / PayPal webhooks and checkout paths
- Resend SMTP wiring
- Nine portal shells under `/(portals)/[portal]` + storefront/account surfaces
- Postgres FTS / portal search (migration `006`)
- Storage object registry metadata scaffold (migration `007`; BYTEA backend still active)
- Auth migration plan + `app` schema strategy docs (no cutover)
- Probe fingerprints on `/api/health` + `/api/ready` (release SHA, schema, storage mode)
- Local-complete HITL wave tasks accepted (`docs/ops/hitl-*-local-complete-wave-2026-08-20.md`)
- DEC interim-owner-defaults-2026-08-21 (all ten DEC records)

## PKG-* map

| Package | Scope (short) | Status | Notes vs current `main` |
| --- | --- | --- | --- |
| `PKG-00` | Reconcile flows → tasks | **partial** | Local-complete + rebuild tasks exist; full 99-flow task set / production-mode matrix not closed |
| `PKG-01` | Signed DEC Accepted values | **partial** | Owner defaults 2026-08-21 on `main` (#40); still revisable; not final legal sign-off |
| `PKG-02` | Protect main / CI / HITL / env approvals | **partial** | CyberOS gates + HITL wave done; full release-governance / proving-PR matrix still open |
| `PKG-03` | US-region topology, staging Vercel, fingerprints, backups, obs | **partial** | APAC Production stays; **US-region deferred**; release/schema/storage fingerprints on probes (Phase 2); staging topology still open |
| `PKG-04` | Async `pg` repositories / transactions | **done** | Async pool replaced synckit/child-process path for current domains |
| `PKG-05` | Safe migrations, private `app` schema, expand/contract | **partial** | Runner + migrations through `007` on public schema; **strategy documented**; private `app` cutover remaining |
| `PKG-06` | Supabase Auth (email/Google/MFA) | **remaining** | Custom `sv_session` kept; **migration plan documented**; cutover deferred |
| `PKG-07` | Orgs, roles, policy, CSRF, rate limits, audit | **partial** | Role shells / basic authz present; full matrix + immutable audit remaining |
| `PKG-08` | Private Supabase Storage | **partial** | Registry metadata + backend scaffold (`007`); BYTEA active; signed URL/scan/quarantine remaining |
| `PKG-09` | Outbox, jobs, provider ledger, email, Zalo | **partial** | Jobs + Resend + payment webhooks exist; full leased outbox / Realtime / Zalo OA remaining (`DEC-COMMS-001`) |
| `PKG-10` | Retire WP import, supplier, admin AI, CapRover/SQLite | **partial** | Paths largely sidelined; dependency proof / full retirement remaining |
| `PKG-11` | Shared schemas, error envelope, cursors, typed client | **partial** | Some API contracts; not universal across portals |
| `PKG-20` | Home, catalog, FTS, product/offers, wishlist base | **partial** | Storefront + FTS + catalog/product surfaces; completeness vs `FL-B2C-01`…`07` still open |
| `PKG-21` | Quote, reservation, checkout, Stripe/PayPal reconcile | **partial** | Interim server quote + 30m reservation + tax/shipping=0 on cart/order (`TASK-COM-003`); sandbox checkout/webhooks; **taxed retail / carriers blocked**; live keys refused (`DEC-PV3-001`) |
| `PKG-22` | Orders, shipment, returns, refunds, timeline | **partial** | Order list/detail + fulfillment; **returns thin policy** (14d defects, refund stub) from DEC-RET |
| `PKG-23` | Reviews, support, goods requests, notifications | **partial** | Support/account shells; depth remaining |
| `PKG-30` | Vendor portal depth | **partial** | Offers/orders/dashboard + payout ledger; settlement preview via DEC-SET rates |
| `PKG-31` | Vendor settlement / payouts | **partial** | DEC-SET interim compute (15%/weekly/$50/manual) shipped; live ACH still out |
| `PKG-40` | Admin portal split / depth | **partial** | Commerce/catalog/vendors/payouts/flags wired; DEC-SET interim banner |
| `PKG-41` | Employee + retail depth | **partial** | Tickets + home sections + retail fulfillment overlay (`TASK-UI-004`) |
| `PKG-50` | B2B + institution pipeline | **partial** | Pipeline/quotes/orders/PO/budget; **Net-30 / 30d validity / admin max 20%** from DEC-B2B |
| `PKG-60` | Publisher + author editorial | **partial** | Requests/MARC/dashboards; stages draft→review→published per DEC-PUB; royalty compute interim |
| `PKG-61` | Royalties / statements | **partial** | DEC-ROY interim compute (10% author / quarterly) shipped; payout still manual |
| `PKG-70` | Shared shell, i18n, a11y, privacy exports | **partial** | Portal shell + locale/theme base; PRIV TTLs filled (24m orders / 30d logs) — purge jobs later |
| `PKG-71` | Fixtures / seed / verification registry | **partial** | Local/docker smoke seeds; TC progress doc; production verification registry remaining |
| `PKG-72` | Full TC matrix harness | **partial** | Unit/smoke/docker + `TC-FIN-*` compute paths; full `TC-*` release suite remaining |
| `PKG-73` | SAST, a11y, load, backup/restore drills | **partial** | Some ops drills documented; capacity/RPO gates remaining |
| `PKG-80` | Staging full rehearsal | **remaining** | Operator checklist: [`../ops/staging-prod-evidence-checklist-2026-08-20.md`](../ops/staging-prod-evidence-checklist-2026-08-20.md); needs DEC-OPS + domain packages |
| `PKG-81` | Production candidate + live checks | **remaining** | No live Stripe/PayPal; needs `DEC-PV3-001` + operator deploy |
| `PKG-82` | Stabilize + final acceptance | **remaining** | After production candidate |
## Major FL groups (rollup)

| Flow group | Status | Notes |
| --- | --- | --- |
| `FL-PLT-*` | **partial** | Health/ready, shell, email wiring; Storage, audit, privacy purge, Zalo remaining |
| `FL-ID-*` | **partial** | Register/login/recovery via custom session; Supabase Auth / MFA / privacy deletion remaining |
| `FL-B2C-01`…`05` | **partial** | Storefront/catalog/search/product largely usable |
| `FL-B2C-06`…`12` | **partial** | Cart + server quote + sandbox checkout; tax0/no-ship/30m; returns thin DEC-RET; taxed retail/carriers still blocked |
| `FL-B2C-13`…`14` | **partial** | Support/review surfaces incomplete vs plan |
| `FL-VEN-*` | **partial** | Offers/orders/payout ledger; settlement compute interim |
| `FL-ADM-*` | **partial** | Commerce/catalog/vendors/payouts/flags wired |
| `FL-EMP-*` / `FL-RET-*` | **partial** | Tickets/home sections + retail fulfillment; returns policy interim |
| `FL-B2B-*` / `FL-INS-*` | **partial** | Pipeline/PO/budget; Net-30 / validity from DEC-B2B |
| `FL-PUB-*` / `FL-AUT-*` | **partial** | Requests/MARC/dashboards; royalty compute interim |
## Adjusted roadmap phases

| Phase | Focus | Gate |
| --- | --- | --- |
| 0 | CDS Thủy · ocean + auth UI parity | Allowed now (platform UI) |
| 1 | Fill DEC Accepted values | **Owner defaults on `main` (#40); revisable** |
| 2 | Foundations delta (Storage, Auth migration plan, `app` schema strategy, observability); defer US-region until `DEC-OPS-001` names it | **Delta shipped (TASK-PLT-002)** — full PKG-08/Auth/`app` cutovers still later packages |
| 3 | B2C completeness (quote/tax/shipping/reservation, returns) | **Interim + returns thin shipped** — taxed retail / carriers await tax>0 / carrier DEC |
| 4 | Portal API depth (`PKG-30`…`60`) under ocean chrome | **Operational depth + DEC-backed finance/B2B terms** |
| 5 | Finance — settlement then royalties | **Interim compute on `main`**; live rails still out |
| 6 | Hardening + TC matrix (`PKG-71`…`73`) | **Partial progress doc** — full matrix after interfaces stabilize |
| 7–9 | Staging / Production evidence / stabilize | Operator checklist shipped; never `sk_live_` until PV3; no auto-deploy |
## Explicit non-goals (until DEC says otherwise)

- Inventing tax > 0 / carrier rate cards
- Live Stripe / PayPal
- WordPress DNS cutover
- Replacing Vercel / Supabase with another host
- Forcing Supabase Auth or US-region move before a dedicated, DEC-aligned migration package
- Inventing Zalo OA ids

## References

- Full plan: [`sachviet-full-production-completion-plan.md`](sachviet-full-production-completion-plan.md) (§9 packages, §24 decisions)
- DEC blocker (2026-08-20): [`../ops/dec-accepted-values-blocker-2026-08-20.md`](../ops/dec-accepted-values-blocker-2026-08-20.md)
- DEC owner defaults (2026-08-21): [`../ops/dec-accepted-values-owner-defaults-2026-08-21.md`](../ops/dec-accepted-values-owner-defaults-2026-08-21.md)
- Storage scaffold: [`../ops/supabase-storage-scaffolding-2026-08-20.md`](../ops/supabase-storage-scaffolding-2026-08-20.md)
- Auth migration plan: [`../ops/auth-migration-plan-2026-08-20.md`](../ops/auth-migration-plan-2026-08-20.md)
- `app` schema strategy: [`../ops/app-schema-migration-strategy-2026-08-20.md`](../ops/app-schema-migration-strategy-2026-08-20.md)
- TC matrix progress: [`../ops/tc-matrix-progress-2026-08-20.md`](../ops/tc-matrix-progress-2026-08-20.md)
- Staging/prod evidence checklist: [`../ops/staging-prod-evidence-checklist-2026-08-20.md`](../ops/staging-prod-evidence-checklist-2026-08-20.md)
- Local-complete HITL: [`../ops/hitl-final-acceptance-local-complete-wave-2026-08-20.md`](../ops/hitl-final-acceptance-local-complete-wave-2026-08-20.md)
- Next DEC revisions checklist: [`../ops/next-dec-revisions-checklist-2026-08-21.md`](../ops/next-dec-revisions-checklist-2026-08-21.md)
- Production migrate `007`: [`../ops/production-migrate-007-2026-08-21.md`](../ops/production-migrate-007-2026-08-21.md)
