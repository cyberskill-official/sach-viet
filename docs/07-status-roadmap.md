# 07 — Current Status, Roadmap, Known Issues

Snapshot: 2026-08-12. Living sources of truth: `docs/tasks/BACKLOG.md` (task status) and `docs/status/` (status site). The greenfield app lives under `app/web`.

## What is done (greenfield rebuild)

`TASK-REBUILD-001` … `TASK-REBUILD-023` are **done**. Phase A (greenfield Vercel + Supabase) may be live at `https://sachviet.cyberskill.world`. That is **not** a claim of real-commerce readiness: identity self-serve, transactional checkout safety, leased jobs, and portal UIs are the 2026-08-13 audit follow-up (`TASK-GOV-001` … `TASK-TEST-001`, status `implementing`). Preview is abandoned. Compose and CI use Postgres, not SQLite.

WordPress DNS / live WP MySQL import stay out of scope (`TASK-CUTOVER-*` / `TASK-MIGRATION-001` remain `on_hold`).

The Next.js package at `app/web` ships machine-gated foundation work across:

- Platform bootstrap, identity/session, shared web foundations
- Catalog/marketplace, storefront cart/checkout, customer support
- Admin commerce, vendor portal/payouts, employee/retail operations
- Notifications + preferences, live in-app notifications (SSE)
- Supplier portal **scope** (product portal still deferred — see on_hold)
- B2B quote pipeline + order/contract/PO flow; institution buyer portal
- Royalty/earnings **policy artefacts** (activation deferred — see below)
- Publisher and author portals (non-financial flows; financial compute gated)
- Email + Zalo integrations (recording stubs when SMTP/Zalo unset)
- Vietnamese-aware catalog search (local default; Meilisearch optional)
- WordPress import compatibility (fixture-driven; not live cutover)
- Quality/preview release bar + B2C greenfield evidence matrix and cutover **plan**

This is **not** a claim of live WordPress production parity or an authorized production cutover.

## Explicitly deferred / not unlocked

| Topic | State |
|---|---|
| Royalty financial activation | Deferred (owner note on REBUILD-016). No invented rates/splits; publisher financial dashboard work stays gated. |
| Production cutover / DNS / WP retirement | Planning-only (owner note on REBUILD-023). `TASK-CUTOVER-001` / `TASK-CUTOVER-002` stay `on_hold`. |
| Remaining product `on_hold` work | Left on hold — no further closures in this hygiene pass. See BACKLOG and supersession note. |

Pointers:

- Royalty deferral: `docs/tasks/rebuild/TASK-REBUILD-016-define-royalty-and-earnings-policy/ship/owner-deferral-2026-07-24.md`
- Cutover planning-only: `docs/tasks/rebuild/TASK-REBUILD-023-prove-b2c-parity-and-plan-cutover/ship/owner-planning-only-2026-07-24.md`
- On-hold supersession (closed duplicates vs left on hold): `docs/tasks/rebuild/.workflow/on-hold-supersession-2026-07-24.md`

## Still on hold (representative)

Do not treat these as next automatic work without operator release:

- Integrations settings screens, retail actions/returns, vendor fulfillment/analytics/export
- Supplier product portal, publisher financial dashboard, security maintenance-endpoint retirement
- Cutover/migration execution, assorted legacy improvements (admin stats consolidate, i18n DataTable, etc.)

Full list: `docs/tasks/BACKLOG.md`.

## Known constraints (greenfield)

1. No unauthorized push/deploy/merge — CyberOS HITL and operator instruction required.
2. Email/Zalo stay recording stubs until real SMTP/Zalo secrets are configured for an authorized environment.
3. Meilisearch is optional; local Vietnamese search is the default path.
4. Cutover plan recording is not production authorization.
5. Generated `dist/` and macOS `.DS_Store` are ignored; canonical status artefacts live under `docs/status/`.

## Suggested next steps (operator-gated)

1. Complete HITL review of `TASK-GOV-001` … `TASK-TEST-001` (status `implementing`). Do not mark `ready_to_test` or `done` without verdict JSON.
2. Optional Production freeze: deploy `COMMERCE_MUTATIONS_ENABLED=0` only with an explicit operator instruction.
3. Decide whether to accept royalty rates/policy (unlocks financial compute) — currently deferred behind `DEC-ROY-001` / `DEC-PUB-001`.
4. Release selected `on_hold` product tasks only with explicit operator instruction (Phase B/C; not unlocked by Production go).
5. WordPress DNS / retirement still needs a **separate** cutover instruction (`TASK-CUTOVER-001` / `002`).
6. Live Stripe/PayPal, Zalo, tax/shipping, and US-region PITR wait on named `DEC-*` records.
