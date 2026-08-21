# SachViet adjusted completion tracker

**As of:** 2026-08-21  
**Baseline:** `main` @ `089a160` vs [`sachviet-full-production-completion-plan.md`](sachviet-full-production-completion-plan.md)  
**Stack default:** stay on **Vercel + Supabase** (Production project in use). Keep **custom `sv_session` + public schema** until a dedicated migration package is scheduled — do **not** force Supabase Auth or US-region move in Waves 0–3 unless `DEC-OPS-001` / identity DECs require it.

**Hard stop (2026-08-21):** interim-DEC-unblocked product slices (Phases 0–4 under interim) are on `main`. Production migrate `007` applied — see [`docs/ops/production-migrate-007-2026-08-21.md`](../ops/production-migrate-007-2026-08-21.md). Further taxed retail / returns / SET / ROY / live PV3 / US / Auth / WP need owner DEC field overrides — [`docs/ops/next-dec-revisions-checklist-2026-08-21.md`](../ops/next-dec-revisions-checklist-2026-08-21.md). **Do not invent rates.**

**Blocking prerequisite (updated 2026-08-20):** interim Accepted values are on `main` via PR [#35](https://github.com/cyberskill-official/sach-viet/pull/35) (`5df30cd`). See [`docs/ops/dec-accepted-values-blocker-2026-08-20.md`](../ops/dec-accepted-values-blocker-2026-08-20.md). Owner may still revise. **Do not invent rates.** Phase 3 physical tax/shipping and Phase 5 settlement/royalties / live PV3 still need owner overrides where DECs say deferred or live-refused.

**Phase 2 foundations delta (TASK-PLT-002):** Storage registry scaffold + Auth/`app` schema plans + probe fingerprints — see [`docs/ops/supabase-storage-scaffolding-2026-08-20.md`](../ops/supabase-storage-scaffolding-2026-08-20.md), [`docs/ops/auth-migration-plan-2026-08-20.md`](../ops/auth-migration-plan-2026-08-20.md), [`docs/ops/app-schema-migration-strategy-2026-08-20.md`](../ops/app-schema-migration-strategy-2026-08-20.md). US-region remains deferred.

**Phase 3 B2C interim (TASK-COM-003):** Server `POST /api/quote` + cart/order UI under DEC-COM interim (USD, tax 0, no shipping, 30m reservation); sandbox payments only; returns deferred note (DEC-RET). Taxed retail / carriers / full returns / live PV3 remain deferred until DEC revision.

**Phase 4 portal depth + hardening slice (TASK-UI-004):** Role portals wired to operational APIs (orders/offers/tickets/pipeline/requests/dashboards/payout ledger/home sections/budget) under ocean chrome; finance scaffolding refuses SET/ROY rate computation; TC progress + staging evidence checklist docs. Settlement/royalty **rates** and B2B Net-N still DEC-gated.

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

## PKG-* map

| Package | Scope (short) | Status | Notes vs current `main` |
| --- | --- | --- | --- |
| `PKG-00` | Reconcile flows → tasks | **partial** | Local-complete + rebuild tasks exist; full 99-flow task set / production-mode matrix not closed |
| `PKG-01` | Signed DEC Accepted values | **partial** | Interim Accepted on `main` (#35); owner may revise; not final business sign-off |
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
| `PKG-21` | Quote, reservation, checkout, Stripe/PayPal reconcile | **partial** | Interim server quote + 30m reservation + tax/shipping=0 on cart/order (`TASK-COM-003`); sandbox checkout/webhooks; **taxed retail / carriers blocked** until DEC-COM revision; live keys refused (`DEC-PV3-001`) |
| `PKG-22` | Orders, shipment, returns, refunds, timeline | **partial** | Order list/detail + fulfillment fragments + expiresAt/totals; returns/refund allocation **DEC-RET-001 deferred** (thin UX note only) |
| `PKG-23` | Reviews, support, goods requests, notifications | **partial** | Support/account shells; depth remaining |
| `PKG-30` | Vendor portal depth | **partial** | Offers/orders/dashboard + payout ledger read; settlement math **DEC-SET** gated (`TASK-UI-004`) |
| `PKG-31` | Vendor settlement / payouts | **remaining** | Blocked on `DEC-SET-001` rates; refuse-compute scaffold shipped |
| `PKG-40` | Admin portal split / depth | **partial** | Commerce/catalog/vendors/payouts/flags wired; DEC-SET banner on payouts |
| `PKG-41` | Employee + retail depth | **partial** | Tickets + home sections + retail fulfillment overlay (`TASK-UI-004`) |
| `PKG-50` | B2B + institution pipeline | **partial** | Pipeline/quotes/orders/PO/budget wired; Net-N **DEC-B2B** gated |
| `PKG-60` | Publisher + author editorial | **partial** | Requests/MARC/dashboards wired; rights/royalty **DEC-PUB/ROY** gated |
| `PKG-61` | Royalties / statements | **remaining** | Blocked on `DEC-ROY-001`; refuse-compute scaffold shipped |
| `PKG-70` | Shared shell, i18n, a11y, privacy exports | **partial** | Portal shell + locale/theme base; WCAG/privacy completeness remaining (`DEC-PRIV-001`) |
| `PKG-71` | Fixtures / seed / verification registry | **partial** | Local/docker smoke seeds; TC progress doc; production verification registry remaining |
| `PKG-72` | Full TC matrix harness | **partial** | Unit/smoke/docker + `TC-FIN-*` refuse paths; full `TC-*` release suite remaining — see [`../ops/tc-matrix-progress-2026-08-20.md`](../ops/tc-matrix-progress-2026-08-20.md) |
| `PKG-73` | SAST, a11y, load, backup/restore drills | **partial** | Some ops drills documented; capacity/RPO gates remaining |
| `PKG-80` | Staging full rehearsal | **remaining** | Operator checklist: [`../ops/staging-prod-evidence-checklist-2026-08-20.md`](../ops/staging-prod-evidence-checklist-2026-08-20.md); needs DEC-OPS + domain packages |
| `PKG-81` | Production candidate + live checks | **remaining** | No live Stripe/PayPal; needs `DEC-PV3-001` + operator deploy |
| `PKG-82` | Stabilize + final acceptance | **remaining** | After production candidate |
## Major FL groups (rollup)

| Flow group | Status | Notes |
| --- | --- | --- |
| `FL-PLT-*` | **partial** | Health/ready, shell, email wiring; Storage, audit, privacy, Zalo remaining |
| `FL-ID-*` | **partial** | Register/login/recovery via custom session; Supabase Auth / MFA / privacy deletion remaining |
| `FL-B2C-01`…`05` | **partial** | Storefront/catalog/search/product largely usable |
| `FL-B2C-06`…`12` | **partial / DEC-gated** | Cart + server quote + sandbox checkout; interim tax=0 / no-ship / 30m TTL shipped; physical tax/shipping/returns still blocked until DEC revision |
| `FL-B2C-13`…`14` | **partial** | Support/review surfaces incomplete vs plan |
| `FL-VEN-*` | **partial** | Offers/orders/payout ledger; settlement **DEC-SET** gated |
| `FL-ADM-*` | **partial** | Commerce/catalog/vendors/payouts/flags wired |
| `FL-EMP-*` / `FL-RET-*` | **partial** | Tickets/home sections + retail fulfillment; returns policy gated |
| `FL-B2B-*` / `FL-INS-*` | **partial** | Pipeline/PO/budget wired; terms gated by `DEC-B2B-001` |
| `FL-PUB-*` / `FL-AUT-*` | **partial** | Requests/MARC/dashboards; editorial/royalty gated by `DEC-PUB-001` / `DEC-ROY-001` |
## Adjusted roadmap phases

| Phase | Focus | Gate |
| --- | --- | --- |
| 0 | CDS Thủy · ocean + auth UI parity | Allowed now (platform UI) |
| 1 | Fill DEC Accepted values in-repo | **Interim on `main` (#35); owner may revise** |
| 2 | Foundations delta (Storage, Auth migration plan, `app` schema strategy, observability); defer US-region until `DEC-OPS-001` names it | **Delta shipped (TASK-PLT-002)** — full PKG-08/Auth/`app` cutovers still later packages |
| 3 | B2C completeness (quote/tax/shipping/reservation, returns) | **Interim slice shipped (TASK-COM-003)** — USD/tax0/no-ship/30m + sandbox; taxed retail, carriers, full returns await DEC revision |
| 4 | Portal API depth (`PKG-30`…`60`) under ocean chrome | **Operational depth shipped (TASK-UI-004)** — finance rates / Net-N / binding rights still DEC-gated |
| 5 | Finance — settlement then royalties | After `DEC-SET-001`, `DEC-ROY-001` (refuse-compute scaffold on `main` once TASK-UI-004 merges) |
| 6 | Hardening + TC matrix (`PKG-71`…`73`) | **Partial progress doc** — full matrix after interfaces stabilize |
| 7–9 | Staging / Production evidence / stabilize | Operator checklist shipped; never `sk_live_` until PV3; no auto-deploy |
## Explicit non-goals (until DEC says otherwise)

- Inventing tax / shipping / commission / royalty tables
- Live Stripe / PayPal
- WordPress DNS cutover
- Replacing Vercel / Supabase with another host
- Forcing Supabase Auth or US-region move before a dedicated, DEC-aligned migration package

## References

- Full plan: [`sachviet-full-production-completion-plan.md`](sachviet-full-production-completion-plan.md) (§9 packages, §24 decisions)
- DEC blocker: [`../ops/dec-accepted-values-blocker-2026-08-20.md`](../ops/dec-accepted-values-blocker-2026-08-20.md)
- Storage scaffold: [`../ops/supabase-storage-scaffolding-2026-08-20.md`](../ops/supabase-storage-scaffolding-2026-08-20.md)
- Auth migration plan: [`../ops/auth-migration-plan-2026-08-20.md`](../ops/auth-migration-plan-2026-08-20.md)
- `app` schema strategy: [`../ops/app-schema-migration-strategy-2026-08-20.md`](../ops/app-schema-migration-strategy-2026-08-20.md)
- TC matrix progress: [`../ops/tc-matrix-progress-2026-08-20.md`](../ops/tc-matrix-progress-2026-08-20.md)
- Staging/prod evidence checklist: [`../ops/staging-prod-evidence-checklist-2026-08-20.md`](../ops/staging-prod-evidence-checklist-2026-08-20.md)
- Local-complete HITL: [`../ops/hitl-final-acceptance-local-complete-wave-2026-08-20.md`](../ops/hitl-final-acceptance-local-complete-wave-2026-08-20.md)
- Next DEC revisions (hard stop): [`../ops/next-dec-revisions-checklist-2026-08-21.md`](../ops/next-dec-revisions-checklist-2026-08-21.md)
- Production migrate `007`: [`../ops/production-migrate-007-2026-08-21.md`](../ops/production-migrate-007-2026-08-21.md)
