# Docker acceptance gate (Wave 4)

**Canonical checklist:** [`app/web/OPERATIONS.md`](../app/web/OPERATIONS.md) § *Docker acceptance checklist (Wave 4)*.

**Automated smoke** (Compose up + seeded):

```bash
cd app/web
npm run smoke:docker
# or: SEED_PASSWORD='…' BASE_URL=http://127.0.0.1:3000 npm run smoke:docker
```

**Hard rules**

- **Vercel production deploy is forbidden** until the Wave 4 checklist is green with evidence for all **required** rows. Item **6** (Stripe webhook → paid → outbox) may be **deferred** until Stripe is registered; item **5** covers unpaid checkout.
- **Vercel preview** may start after local items **1–5** and **7** pass (item 6 optional/deferred).
- Wave 5 preview wiring: [`docs/deploy-vercel-supabase.md`](deploy-vercel-supabase.md). Preview operator go: [`docs/ops/wave5-preview-go.md`](ops/wave5-preview-go.md) (2026-07-26). Production cutover still needs `owner_go_decision` / `separate_deployment_instruction`.
- Cutover gate `backup_verified`: see [`docs/ops/backup-restore-drill.md`](ops/backup-restore-drill.md) (operator-signed).
- Named rollback: [`docs/ops/named-rollback-plan.md`](ops/named-rollback-plan.md).
