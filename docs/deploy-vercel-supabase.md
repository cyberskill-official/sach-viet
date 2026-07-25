# Deploy: Vercel + Supabase (Wave 5 — preview wiring)

**Primary production target:** Vercel (Next.js in `app/web`) + Supabase (Postgres).  
**CapRover / SQLite** is transitional only — see [`app/web/OPERATIONS.md`](../app/web/OPERATIONS.md) (historical CapRover checklist kept, marked superseded).

This document is operator wiring for **preview**. It does **not** authorize production deploy, DNS cutover, or WordPress retirement. CyberOS: never push/deploy/merge without an explicit operator instruction. Agents must not run `vercel deploy` or `supabase` cloud CLI against real projects from this path.

Canonical env name lists: [`app/web/.env.example`](../app/web/.env.example), [`app/web/.env.vercel.example`](../app/web/.env.vercel.example).

---

## Prerequisites (Docker acceptance)

| Deploy kind | Gate |
|---|---|
| **Vercel Preview** | Local [Docker acceptance checklist](docker-acceptance-gate.md) items **1–7** green |
| **Vercel Production** | Full Wave 4 checklist **100% green** (including backup drill evidence) **and** explicit operator go |

Do not start cloud preview until Compose smoke (items 1–7) has passed locally.

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

Prefer Supabase dashboard backups / PITR for cloud. Local Compose still uses `pg_dump` / `pg_restore` (`npm run backup:pg`). Cutover gate `backup_verified` stays unmet until [`docs/ops/backup-restore-drill.md`](ops/backup-restore-drill.md) is filled.

---

## 2. Link Vercel to the repo / `app/web`

1. Create or open a Vercel project linked to this Git repository.
2. Set **Root Directory** to `app/web` (required — the Next app is not at the repo root).
3. Framework: Next.js. Optional local config: [`app/web/vercel.json`](../app/web/vercel.json) (`installCommand` / `buildCommand` only).
4. Node: match `engines` in `app/web/package.json` (Node ≥ 24).
5. Enable **Preview** deployments for PRs/branches as desired. Leave **Production** deployments disabled or protected until the Wave 4 gate is green and an operator explicitly authorizes production.

`output: "standalone"` in `next.config.ts` remains for the Docker/CapRover image path. Vercel uses its own Next.js build pipeline; do not deploy the CapRover Dockerfile through Vercel.

---

## 3. Environment variables (names only)

Set these in the Vercel project **Environment Variables** UI. Prefer **Preview**-scoped values first. See [`.env.vercel.example`](../app/web/.env.vercel.example).

| Name | Notes |
|---|---|
| `AUTH_SESSION_SECRET` | Min 32 characters (`openssl rand -hex 32`) |
| `DATABASE_URL` | Supabase **pooler** URL for runtime |
| `BOOTSTRAP_ADMIN_EMAIL` | Optional; with hash, only when user store is empty |
| `BOOTSTRAP_ADMIN_PASSWORD_HASH` | From `npm run hash-password` (no `$` escaping needed in Vercel UI) |
| `STRIPE_SECRET_KEY` | Preview: `sk_test_…` only |
| `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` | Preview deployment URLs (or wildcards per Stripe/Vercel practice) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret for the Preview endpoint |
| `AI_SETTINGS_SECRET` | Min 32 characters if using admin BYOK AI |
| `SMTP_*` / Zalo / Meili | Optional; unset → recording stubs |

Never set `SEED_PASSWORD` or `DATABASE_PATH` on Vercel.

---

## 4. Operator preview sequence (manual)

No agent should run these against a real cloud project unless an operator explicitly asks.

1. Confirm Docker acceptance items **1–7** locally ([OPERATIONS](../app/web/OPERATIONS.md) / [gate pointer](docker-acceptance-gate.md); `npm run smoke:docker`).
2. Create Supabase project → apply migrations with direct `DATABASE_URL`.
3. Create/link Vercel project → Root Directory `app/web` → set Preview env vars.
4. Open a PR (or push a non-production branch) so Vercel builds a **Preview** URL — or use the Vercel dashboard **Deploy** for Preview only after operator instruction.
5. Smoke on Preview: `/api/health` → `{"ok":true,"db":"ok"}`; login; catalog; checkout pending path; optional Stripe test webhook; optional admin AI playground.
6. **Stop.** Do not promote to Production, attach production domains, or change WordPress DNS.

---

## 5. Production (forbidden until gate + operator go)

Production on Vercel is **forbidden** until:

1. Full Wave 4 checklist is green with evidence (including backup drill).
2. Cutover gates in the B2C cutover plan are addressed as required for the chosen Phase A scope.
3. An **explicit operator instruction** authorizes production deploy (CyberOS).

This Wave 5 wiring document alone is insufficient for production.

---

## CapRover status

| Path | Status |
|---|---|
| Vercel + Supabase | **Primary target** |
| CapRover + Docker image / historical SQLite | **Transitional / superseded** for new work |

Offline CapRover package prep (`npm run prepare:preview`) may still record `prepared_local`. Live CapRover deploy remains operator-authorized and is not the default path. See OPERATIONS § *Operator CapRover deploy checklist (superseded)*.
