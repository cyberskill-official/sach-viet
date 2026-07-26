# Wave 5 Preview — superseded (2026-07-26)

**Status:** **Superseded.** Operator later instructed: *“We have no preview mode, go straight to production.”*

Canonical authorization: [`docs/ops/production-go-2026-07-26.md`](production-go-2026-07-26.md).

## Historical note

An earlier operator **Go** (same day) authorized Vercel Preview only. Preview deployments on project **sachviet** failed with empty `previewUrl` (e.g. `dpl_5eWXU66rTNnVVpgvYhRKJuuShTeK`) before Production go superseded this path. Do not treat Preview as a required gate.

## Still useful

- Wave 4 Docker acceptance and serverless Postgres readiness work remain prerequisites for Production.
- Wiring reference: [`docs/deploy-vercel-supabase.md`](../deploy-vercel-supabase.md) (Production section).
