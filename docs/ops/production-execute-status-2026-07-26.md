# Production execute status (2026-07-26)

Tracks the checklist in [`production-go-2026-07-26.md`](production-go-2026-07-26.md).

| Step | State | Evidence |
|---|---|---|
| PR #21 merged to `main` | **done** | `f46ffa7` |
| Vercel Production **build** for `main` | **done** | GitHub deployment `5606431287` — state `success`; URL `https://sachviet-l1yd7a260-cyberskill-world.vercel.app` |
| Authenticate Vercel + Supabase MCP / CLI | **blocked** | Cloud agent: interactive MCP auth unavailable; CLI has no token; dashboard SSO blocks anonymous smoke |
| Supabase project + `npm run migrate` (direct URL) | **pending** | Needs Supabase credentials |
| Vercel Production env (`AUTH_SESSION_SECRET`, pooler `DATABASE_URL`) | **pending** | Needs Vercel API/dashboard |
| Redeploy Production after env | **pending** | Depends on env |
| Smoke `/api/health` → db ok | **pending** | Depends on env + public/bypass access |
| Cutover `executed: true` | **pending** | Flip only after health smoke |

## Unblock (operator)

1. In **Cursor desktop IDE**, authenticate MCP servers **Vercel** and **Supabase**, then ask the agent to retry — **or**
2. Provide to the agent environment (do not commit):
   - `VERCEL_TOKEN` (team token with project scope)
   - `DATABASE_URL_DIRECT` (Supabase port 5432)
   - `DATABASE_URL` / pooler URL for Vercel Production
   - Optional: `VERCEL_PROTECTION_BYPASS`, bootstrap admin email/password

## Smoke command (once BASE_URL works)

```bash
cd app/web
BASE_URL='https://<production-host>' npm run smoke:production
```
