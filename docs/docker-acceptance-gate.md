# Docker acceptance gate (Wave 4)

**Canonical checklist:** [`app/web/OPERATIONS.md`](../app/web/OPERATIONS.md) § *Docker acceptance checklist (Wave 4)*.

**Automated smoke** (Compose up + seeded):

```bash
cd app/web
npm run smoke:docker
# or: SEED_PASSWORD='…' BASE_URL=http://127.0.0.1:3000 npm run smoke:docker
```

**Hard rules**

- **Vercel production deploy is forbidden** until that checklist is 100% green with evidence.
- **Vercel preview** may start only after local checklist items **1–7** pass.
- Wave 5 preview wiring: [`docs/deploy-vercel-supabase.md`](deploy-vercel-supabase.md). Production cutover still needs an explicit operator instruction after this gate is green.
- Cutover gate `backup_verified` remains **unmet** until [`docs/ops/backup-restore-drill.md`](ops/backup-restore-drill.md) is filled by an operator.
