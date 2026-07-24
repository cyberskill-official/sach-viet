# Repo context map

```yaml
artefact: repo-context-map@1
task_id: TASK-REBUILD-001
generated_at: "2026-07-24T00:00:00Z"
task_module: rebuild
repo_root: /Users/stephencheng/Projects/CyberSkill/sachviet
existing_patterns:
  - kind: application_boundary
    value: "The greenfield application is one full-stack Next.js App Router package in app/web. The operator selected this boundary on 2026-07-24."
    pinned_in: docs/tasks/rebuild/TASK-REBUILD-001-bootstrap-platform-foundation/spec.md:32-41
  - kind: test_framework
    value: "The foundation uses the built-in Node test runner with the experimental coverage report."
    pinned_in: app/web/package.json:5-12
  - kind: packaging
    value: "The application uses a standalone Next.js build with a multi-stage Node 24 Dockerfile and a CapRover schema version 2 definition."
    pinned_in: app/web/next.config.ts:3-4, app/web/Dockerfile:1-31, app/web/captain-definition:1-4
  - kind: observability
    value: "The non-runtime verifier emits redacted JSON lifecycle events to standard output."
    pinned_in: app/web/scripts/verify-foundation.mjs:16-17,59-70
  - kind: secret_handling
    value: "Environment files and generated dependency output are ignored. The workspace contains no separate API package."
    pinned_in: app/.gitignore:1-9
schemas: []
files_outside_immediate_domain: []
blast_radius:
  files_in_immediate_domain: 17
  files_outside_immediate_domain: 0
  modules_touched: 1
  cross_module_edges: 0
  score: 10
module_placement_warning: null
scan_notes:
  - "The old uncommitted Nuxt and Laravel scaffolds were moved to a temporary local archive before the Next.js scaffold was created."
  - "The pre-existing .DS_Store change is unrelated to this task and remains untouched."
  - "The task declares no migrations, data model, external API, or personal-data flow."
```

The active application pattern is the operator-selected Next.js boundary. The historical handoff's Nuxt and Laravel direction is not an implementation target.
