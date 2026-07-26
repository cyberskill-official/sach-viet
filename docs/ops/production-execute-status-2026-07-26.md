# Production execute status (2026-07-26)

Tracks the checklist in [`production-go-2026-07-26.md`](production-go-2026-07-26.md).

| Step | State | Evidence |
|---|---|---|
| PR #21 merged to `main` | **done** | `f46ffa7` |
| PR #22 helpers + handoff on `main` | **done** | `6a5b726` — `wire:production` / `smoke:production` + local checklist |
| PR #23 status sync | **done** | Merged `160f153` (2026-07-26 desktop) |
| Vercel Production **build** for `main` | **done** | Latest: `dpl_FgTFmp8368gwRYrKeKUtgdcw4vKb` after Root Directory fix; alias `https://sachviet.cyberskill.world` |
| Authenticate Vercel + Supabase MCP / CLI | **blocked in this agent** | Vercel **CLI** OK. This chat is a **private-worker** agent: MCP `mcp_auth` unavailable (“only available in the Cursor desktop IDE”); CallMcpTool only sees `goldfish`. Other IDE Agent sessions can use Vercel/Supabase MCP — continue execute there, or export `DATABASE_URL*` here. |
| Vercel project settings | **done** | Node `24.x`; **Root Directory=`app/web`** (API PATCH); Deployment Protection SSO cleared (`ssoProtection=null`). Prior null-root builds nested routes under `/web/src/app/...` (404). |
| Supabase project + `npm run migrate` (direct URL) | **blocked** | Needs plaintext `DATABASE_URL_DIRECT` (sensitive env not readable via `vercel env pull` / `env run`) |
| Vercel Production env (`AUTH_SESSION_SECRET`, pooler `DATABASE_URL`) | **present / unverified** | Names set on Production (sensitive). Values cannot be pulled; `vercel env run` sees empty. Must re-upsert via `wire:production` with operator URLs if wrong. |
| Redeploy Production after Root Directory | **done** | CLI `vercel deploy --prod` → ready; homepage `200` on custom domain |
| Smoke `/api/health` → db ok | **blocked** | `GET https://sachviet.cyberskill.world/api/health` hangs (0 bytes / timeout). Static `/` and `/login` OK. Likely bad/unreachable `DATABASE_URL` and/or synckit worker at runtime — cannot PASS until DB strings verified. |
| Cutover `executed: true` | **pending** | Flip only after health smoke with `db=ok` |
| Phase B/C / Stripe / WP DNS | **on_hold** | No unlock without new operator instruction |

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
