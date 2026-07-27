# Production execute status (2026-07-26)

Tracks the checklist in [`production-go-2026-07-26.md`](production-go-2026-07-26.md).

| Step | State | Evidence |
|---|---|---|
| PR #21 merged to `main` | **done** | `f46ffa7` |
| PR #22 helpers + handoff on `main` | **done** | `6a5b726` — `wire:production` / `smoke:production` + local checklist |
| PR #23 status sync | **done** | Merged `160f153` (2026-07-26 desktop) |
| Vercel project settings | **done** | Node `24.x`; Root Directory=`app/web`; SSO protection off |
| Supabase Production project | **done** | `eskazygpnygqsrcwlszz` (CyberSkill / ap-southeast-1); schema migrations `001`+`002` applied |
| Vercel Production env | **done** | `wire:production` upserted pooler `DATABASE_URL` + new `AUTH_SESSION_SECRET` (2026-07-26) |
| Runtime fix (synckit hang) | **done (live)** | Health uses async `pg`; Vercel path uses `db-rpc-oneshot.mjs` spawnSync (deploy `dpl_CHYMbTjZ6Yk9a8CnVxEKumQvyvvg`) — land to git so next `main` deploy keeps it |
| Smoke `/api/health` → db ok | **done** | `https://sachviet.cyberskill.world/api/health` → `{"ok":true,"db":"ok"}`; `npm run smoke:production` exit 0 (health+catalog PASS; admin-login skipped; empty catalog day-2) |
| Cutover `executed: true` | **done** | [`cutover-plan.md`](../tasks/rebuild/TASK-REBUILD-023-prove-b2c-parity-and-plan-cutover/ship/cutover-plan.md) @ 2026-07-26T08:09:00Z |
| Day-2 catalog | **done** | `TASK-ADMIN-002`: Production bootstrap env upserted + redeploy `dpl_324eRmWeSMamvwgTF24qFdyd8vqB` READY; admin login OK; created category `sach-tieng-viet`, product `sachviet-day2-demo` (+ variant), active in-stock offer; public catalog count=1; `npm run smoke:production` 4/4 PASS (2026-07-27). No secrets committed; never `seed:local` on Production. |
| Stripe | **on_hold** | Deferred until explicit Stripe registration instruction |
| WordPress / DNS / retirement | **N/A — no WP** | Do not pursue WP import, DNS, or retirement |
| Phase B/C | **on_hold** | No unlock without new operator instruction |

Helpers on `main` (from PR #22):

- `npm run wire:production` → [`app/web/scripts/wire-production-env.mjs`](../../app/web/scripts/wire-production-env.mjs)
- `npm run smoke:production` → [`app/web/scripts/smoke-production.mjs`](../../app/web/scripts/smoke-production.mjs)

---

## Local-mode handoff checklist (copy-paste)

Do this on a trusted machine (or after authenticating Vercel + Supabase MCP in Cursor desktop). **Never commit secrets.**

### A. Supabase

1. Create (or open) a Supabase project for SachViet Production.
2. **Project Settings → Database** — copy both:
   - **Direct** URL (port `5432`) → use as `DATABASE_URL_DIRECT` for migrate only
   - **Pooler** URL (transaction / port `6543`) → use as `DATABASE_URL` on Vercel Production
3. Do **not** run `npm run seed:local` against this database.

### B. Secrets to generate

```bash
# Session secret (min 32 chars)
openssl rand -hex 32
# → AUTH_SESSION_SECRET

# Optional first admin (only when user store is empty)
cd app/web
printf '%s' 'your-admin-password' | npm run hash-password
# → BOOTSTRAP_ADMIN_PASSWORD_HASH (paste into Vercel UI as-is; no $$ escaping)
# Also set BOOTSTRAP_ADMIN_EMAIL
```

Optional: `AI_SETTINGS_SECRET` (`openssl rand -hex 32`), SMTP vars. Omit all `STRIPE_*` until Stripe is registered.

### C. Vercel project UI

Project: **sachviet** (`cyberskill-world/sachviet`, id `prj_WrbHjx5rpE5TebwbScVmdB5CyPmt`)

1. **Root Directory** = `app/web` (preferred long-term; repo-root `vercel.json` still has a copy workaround if unset)
2. **Node.js Version** = **24.x**
3. **Deployment Protection**: disable for Production **or** create a Protection Bypass secret and export `VERCEL_PROTECTION_BYPASS` for smoke
4. Production branch = `main`

### D. Wire + redeploy (CLI)

```bash
cd app/web
export VERCEL_TOKEN='…'                    # team token with project scope
export VERCEL_TEAM_ID='…'                  # if required by the token
export DATABASE_URL='postgres://…pooler…'  # port 6543
export DATABASE_URL_DIRECT='postgres://…'  # port 5432
export AUTH_SESSION_SECRET='…'             # >= 32 chars
# optional:
# export BOOTSTRAP_ADMIN_EMAIL='…'
# export BOOTSTRAP_ADMIN_PASSWORD_HASH='…'
# export AI_SETTINGS_SECRET='…'

npm run wire:production
# Migrates via DIRECT, upserts Production env, requests Production redeploy.
# SKIP_MIGRATE=1 / SKIP_REDEPLOY=1 available for partial runs.
```

### E. Smoke

```bash
cd app/web
export BASE_URL='https://<production-host>'   # no trailing slash
# export VERCEL_PROTECTION_BYPASS='…'        # if Deployment Protection stays on
# export BOOTSTRAP_ADMIN_EMAIL='…'
# export BOOTSTRAP_ADMIN_PASSWORD='…'        # plain password for login smoke

npm run smoke:production
# Expect: health-postgres PASS with db=ok
```

### F. After green health

1. Flip [`cutover-plan.md`](../tasks/rebuild/TASK-REBUILD-023-prove-b2c-parity-and-plan-cutover/ship/cutover-plan.md) `executed: true` with Production URL + timestamp.
2. Update this table’s pending rows to **done**.
3. Load catalog (next section). Still **no** WP DNS / retirement.

---

## Day-2 catalog (Phase A — no WordPress)

**Completed 2026-07-27** via admin catalog APIs (`TASK-ADMIN-002`): category + product/variant + active in-stock offer on Production; public catalog non-empty; smoke 4/4.

- **No WordPress** — no fixture WP import, no live WP MySQL migration, no WP DNS.
- **Stripe** stays deferred until an explicit registration instruction.
- **Never** run `seed:local` / Compose seed against Supabase Production.

---

## Unblock for agents

1. Authenticate **Vercel** + **Supabase** MCP in Cursor **desktop**, then ask the agent to retry — **or**
2. Provide env vars from sections A–B (not in git) and ask the agent to run `npm run wire:production` + `npm run smoke:production`.
