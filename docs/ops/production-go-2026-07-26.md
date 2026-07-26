# Vercel Production — operator go (2026-07-26)

**Decision:** Operator instructed: *“We have no preview mode, go straight to production.”*  
**Authority:** CyberOS `owner_go_decision` + `separate_deployment_instruction` for **Phase A greenfield on Vercel + Supabase**.

## Authorized

- Deploy / promote the greenfield Next.js app (`app/web`) to **Vercel Production**.
- Use Supabase Postgres as the Production database (`DATABASE_URL` pooler at runtime; direct URL for migrations).
- Ship with **Stripe deferred** (Wave 4 item 6): unpaid checkout / pending orders remain the commerce proof until Stripe is registered.
- Email/Zalo/Meili may stay recording stubs until secrets are set.

## Explicitly not authorized

- WordPress DNS cutover, traffic switch, or WP retirement (`TASK-CUTOVER-001` / `TASK-CUTOVER-002` stay `on_hold`).
- Royalty financial activation / invented rates (REBUILD-016 deferral).
- Bulk release of Phase B/C `on_hold` product tasks.
- CapRover as the Production path (superseded).
- Running `seed:local` against Supabase Production.

## Supersedes

- [`docs/ops/wave5-preview-go.md`](wave5-preview-go.md) — Preview-only go is abandoned; Production is the only cloud target.

## Prerequisites (met)

| Item | Evidence |
|---|---|
| Wave 4 required rows (Stripe deferred) | [`app/web/OPERATIONS.md`](../../app/web/OPERATIONS.md) |
| Backup verified | [`docs/ops/backup-restore-drill.md`](backup-restore-drill.md) |
| Named rollback | [`docs/ops/named-rollback-plan.md`](named-rollback-plan.md) |
| Serverless Postgres readiness | PR #21 (`db-worker` paths, migrations tracing, remote TLS, Node `24.x`) |

## Operator execution checklist

1. Vercel project **sachviet** (`cyberskill-world/sachviet`):
   - Root Directory = `app/web` in the Vercel UI when possible (`rootDirectory` cannot be set in `vercel.json`). Repo-root `vercel.json` workarounds a null Root Directory by copying `app/web` into the build root at install time.
   - Node.js Version = **24.x**
   - Production branch = `main` (or promote the authorized deployment)
2. Supabase: create/use Production project → `npm run migrate` with **direct** `DATABASE_URL` from a trusted machine.
3. Vercel **Production** env (names in [`app/web/.env.vercel.example`](../../app/web/.env.vercel.example)):
   - Required: `AUTH_SESSION_SECRET`, `DATABASE_URL` (pooler)
   - Optional: bootstrap admin, `AI_SETTINGS_SECRET`, SMTP
   - Omit all `STRIPE_*` until registered
4. Merge readiness PR #21 (or equivalent) to `main` so Production builds the authorized commit.
5. Confirm Production URL: `GET /api/health` → `{"ok":true,"db":"ok"}`; login; catalog; unpaid checkout path.
6. Authenticate **Vercel** + **Supabase** MCP in Cursor if agents should operate the dashboards next.

## Cutover plan gates

| Gate | State after this go |
|---|---|
| `owner_go_decision` | `met` — this document |
| `separate_deployment_instruction` | `met` — Production deploy on Vercel + Supabase, Stripe deferred, no WP DNS |
| WP DNS / retirement | still **not** authorized |
