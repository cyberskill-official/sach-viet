# Implementation plan

```yaml
artefact: implementation-plan@1
task_id: TASK-REBUILD-002
estimate_points: 8
```

1. Add a server-only SQLite store that initializes users, sessions, and per-email login-attempt records.
2. Add password verification, first-admin bootstrap, opaque signed session cookies, expiry, logout, and a safe redirect helper in `src/lib/auth-core.mjs`.
3. Define the documented roles, portal access mappings, role checks, and reusable ownership checks in `src/lib/access.mjs`.
4. Add login, logout, and current-session route handlers that never expose a password hash or session identifier in JSON.
5. Add a focused login page and a forbidden page. Keep browser state in the login form only.
6. Add `src/proxy.ts` as a fast redirect guard while keeping every authorization decision on the server.
7. Update the static verification command, container data directory, operations guide, and ignored local database files.
8. Add Node tests for every edge-case-matrix row and run the repository quality gates.
