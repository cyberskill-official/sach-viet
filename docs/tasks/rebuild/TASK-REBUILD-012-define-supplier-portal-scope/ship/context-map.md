# Context map

Touched domain: greenfield supplier portal **scope definition** only (docs/decision artefacts). No supplier product surface is implemented.

## Source inventory

- Roles: `employee_supplier` placeholder liaison; supplier API/middleware marked placeholder (`docs/04-roles-permissions.md`)
- Roadmap: supplier portal not started — role + middleware placeholder only (`docs/07-status-roadmap.md`)
- Portals: nine portals listed without a supplier product section (`docs/03-portals.md`)

## Greenfield reservations (not a shipped portal)

- `app/web/src/lib/access.mjs` — `employee_supplier` in `ROLES`; `supplier` portal ACL
- `app/web/src/lib/web-foundations.mjs` — `supplier` accent label
- `app/web/src/proxy.ts` — `/supplier/:path*` matcher

## Explicitly untouched

- No `app/web/src/app/api/supplier/**`
- No supplier portal page module beyond the shared `[portal]` shell reservation
- `TASK-SUPPLIER-001` remains `on_hold`
- Notification + SSE live stream from Tasks 10–11 left intact
