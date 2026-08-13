# Docker acceptance gate (Wave 4)

**Canonical checklist:** [`app/web/OPERATIONS.md`](../app/web/OPERATIONS.md) § *Docker acceptance checklist (Wave 4)*.

**Automated smoke** (Compose up + seeded):

```bash
cd app/web
npm run smoke:docker
# or: SEED_PASSWORD='…' BASE_URL=http://127.0.0.1:3000 npm run smoke:docker
```

**Hard rules**

- Wave 4 required rows must be green before Production (item **6** Stripe may stay **deferred**; item **5** covers unpaid checkout).
- **1b-ready** (`GET /api/ready`) is in `npm run smoke:docker`. On 2026-08-13 Compose `web` was down, so that check was not exercised end-to-end — re-run with `web` healthy before treating 1b as locally proven.
- **Vercel Production** Phase A is authorized — [`docs/ops/production-go-2026-07-26.md`](ops/production-go-2026-07-26.md). Preview mode is abandoned. The golive-wave **sandbox candidate** is prepare-only ([`OPERATIONS.md`](../app/web/OPERATIONS.md) § Wave 5) and does not authorize merge/deploy.
- Production wiring: [`docs/deploy-vercel-supabase.md`](deploy-vercel-supabase.md). WP DNS still needs a separate cutover instruction.
- Cutover gate `backup_verified`: see [`docs/ops/backup-restore-drill.md`](ops/backup-restore-drill.md) (operator-signed).
- Named rollback: [`docs/ops/named-rollback-plan.md`](ops/named-rollback-plan.md).
