# Postgres backup / restore drill evidence

**Cutover gate:** `backup_verified`  
**State:** `met`  
**Authority:** human operator sign-off recorded below (plan approval). Agents must not invent sign-off.

## Drill record (operator)

| Field               | Value                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------- |
| Date (UTC)          | 2026-07-25T18:36:40Z                                                                   |
| Environment         | local Compose `db` on `127.0.0.1:54329` (Postgres 16 alpine)                            |
| Source DB URL       | `postgres://sachviet:***@127.0.0.1:54329/sachviet` (credentials redacted)              |
| Dump command / path | `docker compose exec -T db pg_dump -U sachviet -d sachviet -Fc --no-owner --no-acl > web/backups/sachviet-20260725-183640.dump` → `app/web/backups/sachviet-20260725-183640.dump` (77448 bytes) |
| Restore target      | scratch DB `sachviet_restore_drill` on same Compose Postgres (`postgres://sachviet:***@127.0.0.1:54329/sachviet_restore_drill`) |
| Restore command     | `CREATE DATABASE sachviet_restore_drill`; `cat …dump \| docker compose exec -T db pg_restore -U sachviet -d sachviet_restore_drill --clean --if-exists --no-owner --no-acl` (exit 0) |
| Post-restore check  | `SELECT 1` → ok; `users.email=admin.seed@sachviet.test` role=admin; `products.slug=hoang-tu-be` present; `COUNT(products)=10`; live `/api/health` still `{"ok":true,"db":"ok"}` |
| Smoke result        | `npm run smoke:docker` earlier in same session: automated items 1,3–5,7 **PASS** (9/9); live health still green after restore into scratch DB (primary `sachviet` untouched) |
| Operator            | Human operator sign-off via plan approval **Clear production blockers (Stripe deferred)** (2026-07-25 UTC). Drill executed during PR #19 Docker acceptance; agent recorded evidence; operator approved flip to `met`. |
| Notes               | Host `pg_dump`/`pg_restore` not on PATH; used documented Compose `exec` path. Scratch DB left as `sachviet_restore_drill` for inspection; primary volume retained. |

## How to run (reference)

From `app/web` with Compose Postgres published:

```bash
DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet npm run backup:pg
DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet npm run restore:pg -- --from ./backups/sachviet-….dump
```

Or via Compose (from `app/`):

```bash
mkdir -p web/backups
docker compose exec -T db pg_dump -U sachviet -d sachviet -Fc > web/backups/sachviet-$(date -u +%Y%m%d-%H%M%S).dump
```

See `app/web/OPERATIONS.md` § Postgres backup and restore.

## Sign-off note

This gate was flipped to `met` before Production go. Greenfield Vercel Production is now authorized separately via [`production-go-2026-07-26.md`](production-go-2026-07-26.md). WordPress DNS cutover / retirement still requires its own cutover instruction.
