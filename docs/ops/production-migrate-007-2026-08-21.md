# Production migrate `007` — 2026-08-21

**Task:** `TASK-PLT-002` (ops follow-through)  
**Project:** Supabase APAC `eskazygpnygqsrcwlszz`  
**Why:** Production `/api/ready` was `ok:false` with `migration.latest = 006_portal_search_fulfillment` while `main` @ `089a160` expects `007_storage_object_registry`.

## Applied

1. DDL via Supabase MCP `apply_migration` name `007_storage_object_registry` (same SQL as `app/web/migrations/007_storage_object_registry.sql`) — additive `stored_objects` metadata columns + checks + indexes; BYTEA backend unchanged.
2. App ledger: `INSERT INTO schema_migrations (id, applied_at) VALUES ('007_storage_object_registry', …)` (Vercel skips auto-migrate).

## Verified

```text
GET https://sachviet.cyberskill.world/api/ready
→ ok:true, migration.latest=007_storage_object_registry, release.sha=089a160…
GET /api/health → ok:true
BASE_URL=https://sachviet.cyberskill.world npm run smoke:production
→ health + catalog + checkout-fail-closed PASS; admin-login skipped (no smoke admin secrets in session)
```

## Not done here

- Enabling Supabase Storage as default (`SUPABASE_*` still absent — expected)
- New Vercel promote (Production already on `089a160`)
- Invented tax/shipping/commission/royalty rates
