# Production execute status (2026-07-26)

Tracks the checklist in [`production-go-2026-07-26.md`](production-go-2026-07-26.md).

| Step | State | Evidence |
|---|---|---|
| PR #21 merged to `main` | **done** | `f46ffa7` |
| PR #22 helpers + handoff on `main` | **done** | `6a5b726` — `wire:production` / `smoke:production` + local checklist |
| Vercel Production **build** for `main` | **done** | GitHub deployment `5606431287` — state `success`; URL `https://sachviet-l1yd7a260-cyberskill-world.vercel.app` |
| Authenticate Vercel + Supabase MCP / CLI | **blocked** | Cloud agent 2026-07-26 retry: MCP `needsAuth`; no `VERCEL_TOKEN` / `DATABASE_URL*` / `AUTH_SESSION_SECRET` in env; no Cursor environment secrets |
| Supabase project + `npm run migrate` (direct URL) | **pending** | Needs Supabase credentials |
| Vercel Production env (`AUTH_SESSION_SECRET`, pooler `DATABASE_URL`) | **pending** | Needs Vercel API/dashboard |
| Redeploy Production after env | **pending** | Depends on env |
| Smoke `/api/health` → db ok | **pending** | Depends on env + public/bypass access |
| Cutover `executed: true` | **pending** | Flip only after health smoke |

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

## Day-2 catalog (Phase A — no live WordPress)

After `/api/health` is green, choose one catalog path (operator):

1. **Fixture WordPress import** — admin `wordpress-import` apply against an approved fixture JSON (greenfield compatibility already proven). Preferred controlled load.
2. **Admin commerce APIs/UI** — create categories/products/offers day-2 without import.
3. **Live WP MySQL migration** — stays `on_hold` (`TASK-MIGRATION-001`). Not part of this Production go.

**Never** run `seed:local` / Compose seed against Supabase Preview or Production.

---

## Unblock for agents

1. Authenticate **Vercel** + **Supabase** MCP in Cursor **desktop**, then ask the agent to retry — **or**
2. Provide env vars from sections A–B (not in git) and ask the agent to run `npm run wire:production` + `npm run smoke:production`.
