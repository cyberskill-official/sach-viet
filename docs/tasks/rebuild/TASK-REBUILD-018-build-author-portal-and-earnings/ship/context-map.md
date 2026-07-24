# Context map

Touched domain: greenfield author portal under TASK-REBUILD-016 activation gate.

- `app/web/src/lib/author-portal-core.mjs` — manuscript requests, status logs, dashboard, refuse paths
- `app/web/src/app/api/author/**` — signed-session dashboard and manuscript routes
- Reuses `publisher-portal-core.mjs` activation-gate helpers without mutating publisher scaffolding
- Leaves `TASK-AUTHOR-001`, `TASK-ROYALTY-001`, vendor payouts intact
