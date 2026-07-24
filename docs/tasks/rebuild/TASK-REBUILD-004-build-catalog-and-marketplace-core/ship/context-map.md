# Repo context map

```yaml
artefact: repo-context-map@1
task_id: TASK-REBUILD-004
task_module: rebuild
existing_patterns:
  - kind: application_boundary
    value: "The application is a full-stack Next.js App Router package at app/web."
    pinned_in: app/web/package.json
  - kind: persistence
    value: "SQLite database access uses node:sqlite and DATABASE_PATH, defaulting to /data/sachviet.sqlite."
    pinned_in: app/web/src/lib/auth-core.mjs
  - kind: identity_boundary
    value: "Server-side role and owned-record checks live in src/lib/auth-core.mjs and src/lib/access.mjs."
    pinned_in: app/web/src/lib/auth-core.mjs, app/web/src/lib/access.mjs
  - kind: quality
    value: "Node tests and verifier scripts are the established repository checks."
    pinned_in: app/web/package.json
files_outside_immediate_domain: []
blast_radius:
  files_in_immediate_domain: 10
  files_outside_immediate_domain: 0
  modules_touched: 1
```

The catalog core belongs in `app/web`. It shares the existing SQLite database and identity boundary, but does not add legacy migration, a payment path, external media storage, or search infrastructure.
