# Wave 5 Preview — operator go (2026-07-26)

**Decision:** Operator instructed **Go** after the roadmap status briefing.  
**Scope authorized:** **Vercel Preview** only (Wave 5), with Stripe still deferred.  
**Not authorized:** Vercel Production promote, DNS cutover, WordPress retirement, royalty financial activation, or bulk release of `on_hold` Phase B/C product tasks.

## Prerequisites (already met)

- Wave 4 Docker acceptance items **1–5**, **7–9** green; item **6** (Stripe paid path) deferred — see [`app/web/OPERATIONS.md`](../../app/web/OPERATIONS.md).
- Postgres/Docker foundation on `main` (PR #19).
- Backup drill + named rollback recorded (`backup_verified`, `named_rollback_plan`).

## Operator / agent next actions

1. Confirm Vercel project **sachviet** (`cyberskill-world/sachviet`) Root Directory = `app/web`.
2. Set **Preview**-scoped env vars from [`app/web/.env.vercel.example`](../../app/web/.env.vercel.example): at minimum `AUTH_SESSION_SECRET`, `DATABASE_URL` (Supabase **pooler**), optional `AI_SETTINGS_SECRET` / bootstrap admin. Omit all `STRIPE_*` until registered.
3. Apply migrations against Supabase **direct** URL (`npm run migrate` from `app/web`) — never `seed:local` on cloud.
4. Open/merge a Preview-triggering PR (or redeploy Preview) and smoke: `/api/health`, login, catalog, unpaid checkout path.
5. **Stop.** Production still needs `owner_go_decision` + `separate_deployment_instruction` on the cutover plan.

## Cutover gates (unchanged by this go)

| Gate | State |
|---|---|
| `owner_go_decision` | `unmet` (Preview go ≠ production go) |
| `separate_deployment_instruction` | `unmet` |
