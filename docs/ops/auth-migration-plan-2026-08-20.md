# Auth migration plan — 2026-08-20

**Status:** planning only — **no cutover**  
**Authority:** `DEC-OPS-001` interim Accepted values (keep custom `sv_session` until a dedicated Auth package)  
**Package:** `PKG-06` / `FL-ID-*`  
**Task:** `TASK-PLT-002`

## Current truth

- Identity is custom HMAC cookie `sv_session` (`AUTH_SESSION_SECRET`).
- Register / verify / reset / login live in `app/web` against Postgres `users` (public schema).
- Production stays on this path until an explicit Auth package is scheduled and accepted.

## Target (later package — not this wave)

Supabase Auth with email, optional Google, verification, recovery, MFA, and profile linkage — matching completion-plan `PKG-06`. Do **not** enable Supabase Auth as the session source until that package completes HITL and an operator cutover instruction exists.

## Migration phases (expand / dual-run / contract)

| Phase | What | Gate |
| --- | --- | --- |
| A — Design | Map `users` columns → Auth user + `profiles`; decide MFA and Google; retention vs `DEC-PRIV-001`. | Owner + security review |
| B — Dual-write prep | Add nullable `supabase_auth_user_id` (or equivalent) on public `users`; keep `sv_session` as sole session. | Migration additive only |
| C — Dual-run | New signups optionally create Auth users behind a flag; sessions still `sv_session` until flag flip. | Staging evidence; no Production flag without operator |
| D — Cutover | Issue new sessions from Auth; revoke legacy `sv_session` tokens on a documented schedule. | Dedicated package HITL + operator deploy |
| E — Contract | Remove dual paths and unused HMAC session code once metrics prove Auth-only. | After stable Production window |

## Explicit non-goals (now)

- Replacing `sv_session` in Production or Preview.
- Requiring Supabase Auth env vars for `/api/ready`.
- Inventing MFA policy numbers or deletion SLAs beyond `DEC-PRIV-001`.

## Exit criteria for a future cutover package

1. All `FL-ID-*` scenarios pass under Auth in staging.
2. Legacy sessions revoked safely; cookie name/docs updated.
3. `DEC-OPS-001` revised or a follow-on DEC accepts Auth as primary.
4. Operator explicit deploy instruction (CyberOS: never self-deploy).
