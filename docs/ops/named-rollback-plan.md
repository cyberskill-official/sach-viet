# Named rollback plan (Vercel + Supabase)

**Cutover gate:** `named_rollback_plan`  
**State:** `met`  
**Scope:** Phase A greenfield on Vercel + Supabase (no WordPress DNS cutover).  
**Authority:** operator-owned runbook; this document names the rollback path.

This plan does **not** authorize production deploy. It exists so that when an operator later issues a production go, a named recovery path is already written.

## 1. Application (Vercel)

If a Production (or Preview) deployment misbehaves:

1. Open the Vercel project → **Deployments**.
2. Select the last known-good deployment for the affected environment.
3. Use **Promote to Production** / redeploy that deployment (Vercel “Instant Rollback” / promote previous).
4. Confirm `/api/health` returns `{"ok":true,"db":"ok"}` and smoke login + catalog.

Do not point production DNS at a broken deployment while debugging; roll back first.

## 2. Database (Supabase Postgres)

Prefer the least destructive option that restores correctness:

| Option | When | How |
|---|---|---|
| **A. Supabase PITR / dashboard backup** | Cloud project with backups enabled | Supabase Dashboard → Database → Backups / Point-in-time recovery → restore to a new or existing project per Supabase docs |
| **B. Logical dump restore** | Have a recent `pg_dump -Fc` from `npm run backup:pg` or Compose drill | Create/restore target DB; `pg_restore --clean --if-exists --no-owner --no-acl` (see [`backup-restore-drill.md`](backup-restore-drill.md)) |
| **C. Re-migrate empty DB** | Acceptable to lose data (fresh Phase A) | New Supabase DB → `npm run migrate` against **direct** URL; re-bootstrap admin via env; **never** run `seed:local` against cloud |

After DB restore, point Vercel `DATABASE_URL` (pooler) at the restored project if the connection string changed, then redeploy or restart.

## 3. Secrets and Stripe

- Rotate `AUTH_SESSION_SECRET` / `AI_SETTINGS_SECRET` only if compromise is suspected (invalidates sessions / re-encrypt AI keys).
- Stripe remains **optional** until registration completes; unpaid checkout (pending order) does not require webhook rollback.
- When Stripe is later enabled: ensure webhook endpoint matches the active deployment URL and `STRIPE_WEBHOOK_SECRET` matches the Stripe dashboard.

## 4. Verification after rollback

1. `GET /api/health` → Postgres OK  
2. Admin + customer login (bootstrap or known accounts)  
3. Catalog search  
4. Checkout pending path (Stripe unset or test mode)  
5. Optional: admin AI BYOK fail-closed without key  

## 5. Out of scope

- WordPress DNS / traffic switch rollback (cutover tasks remain `on_hold`)  
- CapRover image rollback (superseded path)  
