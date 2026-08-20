# Supabase Storage scaffolding — 2026-08-20

**Status:** package scaffolding landed; **Postgres BYTEA remains the active backend**  
**Authority:** `DEC-OPS-001` / adjusted Phase 2 (Storage delta without full scan/quarantine lifecycle)  
**Package:** `PKG-08` / `FL-PLT-06`  
**Task:** `TASK-PLT-002`

## Current truth

- Opaque objects live in `stored_objects` (BYTEA `body`) via `POST /api/storage`.
- Keys must not be public URLs; portal APIs pass opaque keys only.
- No `@supabase/supabase-js` client and no private bucket lifecycle yet.

## What this wave ships

1. Migration `007_storage_object_registry` — additive metadata columns: `backend`, `external_path`, `scan_status`, `scanned_at`, `quarantine_reason`.
2. Adapter surface in `storage-core.mjs` / `storage-backend.mjs` that resolves mode `postgres_bytea` (default) vs future `supabase`.
3. Env **names** documented for a later backend (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`) — **not** required for readiness.
4. Readiness/liveness report `storage.mode` without secrets.

## What remains for full `PKG-08`

| Capability | Status |
| --- | --- |
| Private bucket(s) + RLS / no public listing | Not created — operator design + dashboard |
| Upload session → validate type/size → store externally | Deferred |
| Malware scan + quarantine | Deferred |
| Short-lived signed download URLs | Deferred |
| Retention / cleanup jobs | Deferred |
| Cross-tenant denial tests | Deferred |

## Recommended next package (not this PR)

1. Design bucket names (e.g. `sv-private-uploads`) and max size / MIME allowlist with owners.
2. Dual-write: metadata row always in Postgres; body either BYTEA or Storage object path.
3. Make `body` nullable only after backfill proves external objects exist.
4. Wire signed URL issue/revoke behind existing session authz.
5. Add scan worker + quarantine status transitions; never attach quarantined objects to MARC/PO/manuscript flows.

## Explicit non-goals (now)

- Enabling Storage as Production default.
- Requiring Supabase Storage env for `/api/ready`.
- Inventing retention day counts beyond `DEC-PRIV-001` deferrals.
