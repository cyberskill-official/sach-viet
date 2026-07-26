# 07 — Current Status, Roadmap, Known Issues

Snapshot: 2026-07-26. Living sources of truth: `docs/tasks/BACKLOG.md` (task status) and `docs/status/` (status site). The greenfield app lives under `app/web`.

## What is done (greenfield rebuild)

`TASK-REBUILD-001` … `TASK-REBUILD-023` are **done**. The Next.js package at `app/web` ships machine-gated foundation work across:

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

1. ~~Complete the **Docker acceptance checklist (Wave 4)**~~ — **done** (2026-07-25; Stripe item 6 deferred). See `app/web/OPERATIONS.md` / `docs/docker-acceptance-gate.md`.
2. ~~Review and merge the rebuild / Postgres Docker branch~~ — **done** (PR #19 on `main`).
3. ~~Vercel Preview~~ — **superseded**. Operator 2026-07-26: no Preview; **Production** authorized — [`docs/ops/production-go-2026-07-26.md`](ops/production-go-2026-07-26.md). Cutover gates `owner_go_decision` + `separate_deployment_instruction` are **met** for greenfield Vercel + Supabase (Stripe deferred). WP DNS / cutover tasks stay `on_hold`.
4. **Execute Production (critical path):** PR #21 + #22 on `main` (`6a5b726`). Build succeeded; runtime still blocked on credentials. Next human action: desktop MCP auth **or** paste secrets and run `npm run wire:production` then `npm run smoke:production` — tracker [`docs/ops/production-execute-status-2026-07-26.md`](ops/production-execute-status-2026-07-26.md). Flip cutover `executed: true` only after green `/api/health`. Day-2 catalog after that (no WP DNS). Wiring: `docs/deploy-vercel-supabase.md`.
5. Decide whether to accept royalty rates/policy (unlocks financial compute) — currently deferred.
6. Release selected `on_hold` product tasks only with explicit operator instruction (Phase B/C; not unlocked by Production go).
7. WordPress DNS / retirement still needs a **separate** cutover instruction (`TASK-CUTOVER-001` / `002`).
