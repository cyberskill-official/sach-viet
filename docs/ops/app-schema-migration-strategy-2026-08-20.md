# Private `app` schema migration strategy — 2026-08-20

**Status:** strategy only — **no `public` → `app` cutover**  
**Authority:** `DEC-OPS-001` interim (keep **public** schema until a dedicated package)  
**Package:** `PKG-05`  
**Task:** `TASK-PLT-002`

## Current truth

- All application tables live in Postgres **`public`** on Supabase APAC `eskazygpnygqsrcwlszz`.
- Migrations `001`…`007` run via the existing runner (`npm run migrate` / first DB open).
- Runtime role is the configured `DATABASE_URL` user (pooler on Vercel).

## Why defer cutover

Moving to a private `app` schema implies least-privilege roles, search_path changes, and expand/backfill/validate/contract across every table and portal query. Interim DECs keep public until that package is funded and scheduled.

## Target end-state (later)

| Concern | Target |
| --- | --- |
| Schema | Private `app` holds product tables; `public` holds extensions only where required (e.g. `pg_trgm`). |
| Roles | Migration role (DDL); runtime role (DML on `app` only); no table grants on `public` app data. |
| Search path | Runtime `search_path = app, public`. |
| Storage metadata | Object registry rows move with the same expand/contract wave as other tables. |

## Expand / contract outline

1. **Expand:** `CREATE SCHEMA app`; create new tables or views in `app` mirroring `public` (or `ALTER … SET SCHEMA` rehearsed on a clone).
2. **Backfill / dual-read:** optional dual-write period for hot tables; verify row counts and checksums.
3. **Validate:** readiness reports schema fingerprint; CI runs against `app` search_path.
4. **Contract:** drop or leave empty `public` copies only after both app versions pass against expansion schema (completion-plan `PKG-05` done-criteria).

## Operator checklist before any cutover package

1. Clone/staging DB rehearsal with PITR-aware rollback.
2. Update pooler role grants; never print secrets in probes.
3. Revise `DEC-OPS-001` Accepted values from “public until package” to “`app` is primary”.
4. Explicit operator instruction to run migrations against Production.

## Explicit non-goals (now)

- Creating `app` schema in Production.
- Changing search_path or role grants on the live project.
- US-region topology (`PKG-03` US move remains deferred).
