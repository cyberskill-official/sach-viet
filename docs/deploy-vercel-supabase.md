# Deploy: Vercel + Supabase (Production path)

**Primary production target:** Vercel (Next.js in `app/web`) + Supabase (Postgres).  
**CapRover / SQLite** is transitional only — see [`app/web/OPERATIONS.md`](../app/web/OPERATIONS.md) (historical CapRover checklist kept, marked superseded).

**Production authorization (2026-07-26):** operator instructed no Preview mode — go straight to Production. Canonical record: [`docs/ops/production-go-2026-07-26.md`](ops/production-go-2026-07-26.md). Cutover gates `owner_go_decision` and `separate_deployment_instruction` are **met** for greenfield Vercel Production (Stripe deferred). This does **not** authorize WordPress DNS cutover or WP retirement.

CyberOS: agents must not invent further deploy scope (DNS/WP/royalties). Prefer Production env + Production deploy; Preview is optional/abandoned for this project.

Canonical env name lists: [`app/web/.env.example`](../app/web/.env.example), [`app/web/.env.vercel.example`](../app/web/.env.vercel.example).

---

## Prerequisites (Docker acceptance)

| Deploy kind | Gate |
|---|---|
| **Vercel Production** | Wave 4 required rows green (item 6 may stay **deferred** until Stripe is registered) **and** operator Production go — [`production-go-2026-07-26.md`](ops/production-go-2026-07-26.md) (**met**) |
| **Vercel Preview** | Abandoned for this project (operator: no Preview mode). Historical note: [`wave5-preview-go.md`](ops/wave5-preview-go.md) |

Stripe registration is **not** required for non-payment Production Phase A.

---

## 1. Create a Supabase project

1. In the Supabase dashboard, create a project (region of your choice).
2. Open **Project Settings → Database** and copy connection strings:
   - **Pooler (transaction / port 6543)** → set as `DATABASE_URL` on Vercel for the Next.js runtime.
   - **Direct (port 5432)** → use from a trusted operator machine when applying migrations (pooler can break multi-statement migrate sessions).
3. Do not commit connection strings or passwords.

### Apply migrations

From `app/web`, against the **direct** URL (operator machine only):

```bash
cd app/web
export DATABASE_URL='postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'
npm run migrate
```

Confirm `schema_migrations` contains the registry ids (currently `001_initial_schema`, `002_ai_settings`). Migrations also apply automatically the first time the app opens the database; an explicit `npm run migrate` is preferred for a new empty project so failures are visible before Preview traffic.

**Do not** run `npm run seed:local` against Supabase Preview or Production databases.

### Backup note

Prefer Supabase dashboard backups / PITR for cloud. Local Compose still uses `pg_dump` / `pg_restore` (`npm run backup:pg`). Cutover gate `backup_verified` is **met** — see [`docs/ops/backup-restore-drill.md`](ops/backup-restore-drill.md). Named rollback: [`docs/ops/named-rollback-plan.md`](ops/named-rollback-plan.md).

---

## 2. Link Vercel to the repo / `app/web`

1. Create or open a Vercel project linked to this Git repository.
2. **Root Directory** must be `app/web`. Repo-root [`vercel.json`](../vercel.json) sets `"rootDirectory": "app/web"` so Git deployments do not build the monorepo root (`rootDirectory: null` fails with an empty Preview/Production URL). Still set the same path in the Vercel project UI when available.
3. Framework: Next.js. App-local overrides: [`app/web/vercel.json`](../app/web/vercel.json).
4. Node: match `engines` in `app/web/package.json` (`24.x`). Also set **Node.js Version = 24.x** in the Vercel project Build & Deployment settings.
5. Prefer **Production** deployments from `main`. Preview may be disabled (operator: no Preview mode).

`output: "standalone"` in `next.config.ts` remains for the Docker/CapRover image path. Vercel uses its own Next.js build pipeline; do not deploy the CapRover Dockerfile through Vercel.

---

## 3. Environment variables (names only)

Set these in the Vercel project **Environment Variables** UI. Prefer **Production**-scoped values (Preview optional/unused). See [`.env.vercel.example`](../app/web/.env.vercel.example).

| Name | Notes |
|---|---|
| `AUTH_SESSION_SECRET` | Min 32 characters (`openssl rand -hex 32`) |
| `DATABASE_URL` | Supabase **pooler** URL for runtime |
| `BOOTSTRAP_ADMIN_EMAIL` | Optional; with hash, only when user store is empty |
| `BOOTSTRAP_ADMIN_PASSWORD_HASH` | From `npm run hash-password` (no `$` escaping needed in Vercel UI) |
| `STRIPE_SECRET_KEY` | **Optional until Stripe is registered.** Omit for non-payment Phase A; checkout creates a pending order and returns a clear “not configured” error. When ready: Preview uses `sk_test_…` only |
| `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` | Required only when Stripe secret is set |
| `STRIPE_WEBHOOK_SECRET` | Required only when Stripe webhooks are enabled |
| `AI_SETTINGS_SECRET` | Min 32 characters if using admin BYOK AI |
| `SMTP_*` / Zalo / Meili | Optional; unset → recording stubs |

Never set `SEED_PASSWORD` or `DATABASE_PATH` on Vercel.

### Stripe deferred

Until the Stripe account is registered and test keys are available:

- Leave all `STRIPE_*` vars unset on Preview/Production.
- Rely on Wave 4 item **5** (pending checkout without Stripe) as the commerce proof.
- Wave 4 item **6** (webhook → paid → outbox) stays **deferred**; re-open it after wiring Stripe CLI/test Checkout, then add env vars and the webhook endpoint.

---

## 4. Operator Production sequence (manual)

Authorized 2026-07-26 — [`production-go-2026-07-26.md`](ops/production-go-2026-07-26.md). Agents still need Vercel/Supabase credentials (MCP or CLI) to execute against the real projects.

1. Confirm Docker acceptance items **1–5** and **7** locally ([OPERATIONS](../app/web/OPERATIONS.md) / [gate pointer](docker-acceptance-gate.md)). Item **6** (Stripe) may stay deferred.
2. Create Supabase project → apply migrations with direct `DATABASE_URL`.
3. Vercel project → Root Directory `app/web` → Node **24.x** → set **Production** env vars.
4. Merge readiness work to `main` (PR #21 or equivalent) so Production builds the authorized commit — or deploy Production from that commit in the Vercel UI.
5. Smoke on Production: `/api/health` → `{"ok":true,"db":"ok"}`; login; catalog; checkout pending path (Stripe may be unset); optional admin AI playground. Skip Stripe webhook until registered.
6. **Stop before WordPress DNS.** Do not attach legacy WP domains or retire WordPress without a separate cutover instruction.

---

## 5. Production gates (status)

| Requirement | State |
|---|---|
| Wave 4 required rows (Stripe deferred OK) | met |
| `owner_go_decision` / `separate_deployment_instruction` | met — [`production-go-2026-07-26.md`](ops/production-go-2026-07-26.md) |
| Named rollback | met — [`named-rollback-plan.md`](ops/named-rollback-plan.md) |
| WP DNS / retirement | **not** authorized |

---

## CapRover status

| Path | Status |
|---|---|
| Vercel + Supabase | **Primary target** |
| CapRover + Docker image / historical SQLite | **Transitional / superseded** for new work |

Offline CapRover package prep (`npm run prepare:preview`) may still record `prepared_local`. Live CapRover deploy remains operator-authorized and is not the default path. See OPERATIONS § *Operator CapRover deploy checklist (superseded)*.
