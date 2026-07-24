# Repo context map

```yaml
artefact: repo-context-map@1
task_id: TASK-REBUILD-002
generated_at: "2026-07-24T01:10:00+07:00"
task_module: rebuild
repo_root: /Users/stephencheng/Projects/CyberSkill/sachviet
existing_patterns:
  - kind: application_boundary
    value: "One full-stack Next.js App Router package lives at app/web."
    pinned_in: app/web/package.json
  - kind: runtime
    value: "Node.js 24 is required, including its built-in node:sqlite module."
    pinned_in: app/web/package.json:20-22
  - kind: verification
    value: "The built-in Node test runner and static verifier are the established quality boundary."
    pinned_in: app/web/package.json:5-12
  - kind: packaging
    value: "The container starts the Next standalone server as the unprivileged nextjs user."
    pinned_in: app/web/Dockerfile:1-27
  - kind: secret_handling
    value: "Environment files are ignored and the operation guide prohibits committed credentials."
    pinned_in: app/.gitignore:1-9, app/web/OPERATIONS.md:27-29
schemas: []
files_outside_immediate_domain: []
blast_radius:
  files_in_immediate_domain: 13
  files_outside_immediate_domain: 0
  modules_touched: 1
  cross_module_edges: 0
  score: 9
module_placement_warning: null
```

The identity foundation belongs inside `app/web`: its database access, session checks, route handlers, and login page share the same server boundary. The work has no external service, no deployment operation, and no legacy data action.
