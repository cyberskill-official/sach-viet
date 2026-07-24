# Repo context map

```yaml
artefact: repo-context-map@1
task_id: TASK-REBUILD-003
task_module: rebuild
existing_patterns:
  - kind: application_boundary
    value: "The application is a full-stack Next.js App Router package at app/web."
    pinned_in: app/web/package.json
  - kind: identity_boundary
    value: "Server-side sessions and role checks live in src/lib/auth-core.mjs and src/lib/access.mjs."
    pinned_in: app/web/src/lib/auth-core.mjs, app/web/src/lib/access.mjs
  - kind: styling
    value: "Tailwind 4 is imported by src/app/globals.css."
    pinned_in: app/web/src/app/globals.css
  - kind: quality
    value: "Node tests and verifier scripts are the established repository checks."
    pinned_in: app/web/package.json
files_outside_immediate_domain: []
blast_radius:
  files_in_immediate_domain: 15
  files_outside_immediate_domain: 0
  modules_touched: 1
```

The shared web layer belongs entirely in `app/web`. It uses the completed identity foundation and does not introduce external services, business records, or portal-specific workflows.
