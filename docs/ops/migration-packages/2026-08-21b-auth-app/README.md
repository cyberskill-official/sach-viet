# Auth + `app` schema migration package scaffolding — 2026-08-21b

**Status:** scaffolding only — **not executed**  
**Authority:** `DEC-OPS-001` interim-owner-defaults-2026-08-21b  
**Accepted:** migration packages may be **scheduled and scaffolded**; cutover remains **refused** until a later operator gate.

## Package folder

```
docs/ops/migration-packages/
  2026-08-21b-auth-app/
    README.md          ← this file
    checklist.md       ← cutover gate (unchecked)
    auth-dual-write.md ← pointer to existing Auth plan
    app-schema.md      ← pointer to existing app schema strategy
```

## What this package unlocks now

- Documented expand / dual-run / contract outline (no Production DDL).
- Operator checklist for a future cutover window (dates TBD — not invented).
- Explicit non-execution: keep `sv_session` + public schema on Production.

## What remains blocked

- Supabase Auth as session source
- Private `app` schema cutover / search_path flip
- US-region move
- WordPress DNS

## References

- [`../auth-migration-plan-2026-08-20.md`](../auth-migration-plan-2026-08-20.md)
- [`../app-schema-migration-strategy-2026-08-20.md`](../app-schema-migration-strategy-2026-08-20.md)
- [`../dec-accepted-values-owner-defaults-2026-08-21b.md`](../dec-accepted-values-owner-defaults-2026-08-21b.md)
