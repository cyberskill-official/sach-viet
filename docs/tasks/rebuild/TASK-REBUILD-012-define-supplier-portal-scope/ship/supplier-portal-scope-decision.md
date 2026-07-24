# Supplier portal scope decision

**Decision:** Defer greenfield supplier portal product work.

**Date:** 2026-07-24  
**Authority:** Source-grounded default aligned with operator greenfield-only standing orders and the prior deferred supplier handoff pattern. <!-- authority: human-confirmed -->

## Inventory

### Documentation

| Item | Source | State |
| --- | --- | --- |
| `employee_supplier` role | `docs/04-roles-permissions.md` | Placeholder — portal not built |
| `/supplier/*` API guard | `docs/04-roles-permissions.md` | Placeholder |
| Supplier portal in roadmap | `docs/07-status-roadmap.md` | Not started (role + middleware placeholder only) |
| Supplier among nine portals | `docs/03-portals.md` | Absent — portals 1–9 have no supplier product section |

### Greenfield reservations in `app/web` (not a shipped portal)

| Item | Path | State |
| --- | --- | --- |
| Role enum membership | `src/lib/access.mjs` | `employee_supplier` reserved |
| Portal ACL | `src/lib/access.mjs` | `supplier: ["employee_supplier", "admin"]` |
| Accent label | `src/lib/web-foundations.mjs` | `supplier` amber label |
| Proxy matcher | `src/proxy.ts` | `/supplier/:path*` |

### Absent product surfaces

- No `src/app/api/supplier/**` routes
- No supplier-specific dashboard, workflow, or data model beyond the shared portal shell

## Chosen outcome: defer

Do not build a supplier portal, supplier API, seed account, or workflow in the greenfield rebuild until an owner defines:

1. Intended users (who is a supplier liaison vs external partner)
2. Tasks / workflows the portal must support
3. Data boundaries and broker-privacy constraints relative to institutions/vendors
4. Authorization scope (whether `employee_supplier` remains correct)

Keep current greenfield reservations unchanged. Do not invent access-policy expansion or retirement in this task.

## Rejected alternatives

- **Build now** — no source-confirmed workflow or data boundary
- **Retire reservations now** — no owner retire decision
- **Recover legacy supplier middleware** — greenfield-only rebuild; `TASK-SUPPLIER-001` stays `on_hold`
- **Alias to vendor/publisher/author** — those portals are documented; supplier is not

## Triggers for later work

| Trigger | Next action |
| --- | --- |
| Owner supplies users, workflow, data boundary, and auth scope | Separate implement task (not this one) |
| Owner confirms supplier liaison is not needed | Separate retire task to remove reservations |
| Security evidence of an unsafe active supplier path | Separate reviewed security task |

## Explicit non-goals of this record

- No deployment, push, merge, or commit requirement beyond ordinary task artefacts
- No mutation of notification or SSE live-stream work from Tasks 10–11
- No mutation of `TASK-SUPPLIER-001`
