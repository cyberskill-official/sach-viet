# Edge-case matrix

```yaml
artefact: edge-case-matrix@1
task_id: TASK-REBUILD-001
generated_at: "2026-07-24T00:00:00Z"
total_rows: 10
rows:
  - id: ECM-001
    category: NULL_INPUT
    trigger: "The foundation has no local environment file or credential input."
    expected: "Lint, test, verifier, and build commands work without a checked-in environment file."
    severity: high
    planned_test: "app/web/tests/foundation.test.mjs > the Next.js foundation has its required build boundary"
  - id: ECM-002
    category: BOUNDARY
    trigger: "A later task starts from the foundation before a portal, data model, or public API exists."
    expected: "The source tree contains one Next.js package and no separate app/api directory."
    severity: high
    planned_test: "app/web/tests/foundation.test.mjs > the verifier rejects missing packaging and architecture boundaries"
  - id: ECM-003
    category: MALFORMED
    trigger: "The CapRover definition has an unsupported schema version."
    expected: "The non-runtime verifier rejects the foundation before a preview package is built."
    severity: medium
    planned_test: "app/web/tests/foundation.test.mjs > the verifier rejects missing packaging and architecture boundaries"
  - id: ECM-004
    category: MALFORMED
    trigger: "Package metadata selects an unsupported Next.js major version or loses the verifier command."
    expected: "The verifier rejects the changed metadata with a specific failure."
    severity: medium
    planned_test: "app/web/tests/foundation.test.mjs > the verifier rejects unsupported package metadata"
  - id: ECM-005
    category: DEGRADATION
    trigger: "A required foundation file is deleted during later setup."
    expected: "The verifier fails before a runtime process is started."
    severity: medium
    planned_test: "app/web/tests/foundation.test.mjs > the verifier rejects missing required files"
  - id: ECM-006
    category: CONCURRENT
    trigger: "Generated Next.js output or installed dependencies are present while source files change."
    expected: "Generated output and node_modules remain ignored, while source, packaging, and tests stay source-controlled."
    severity: medium
    planned_test: "app/.gitignore plus app/web/.gitignore reviewed by npm run verify"
  - id: ECM-007
    category: SECURITY
    trigger: "A local .env file appears during foundation work."
    expected: "The verifier emits a redacted failure event that does not expose environment values."
    severity: critical
    planned_test: "app/web/tests/foundation.test.mjs > the verification command emits a safe failure event"
  - id: ECM-008
    category: SECURITY
    trigger: "A production dependency includes a reported high-severity advisory."
    expected: "The lockfile applies the supported PostCSS and sharp overrides and npm audit reports no high or critical findings."
    severity: high
    planned_test: "app/web/package-lock.json verified by npm audit --audit-level=high"
  - id: ECM-009
    category: OBSERVABILITY
    trigger: "The static verifier starts, completes, or catches an invalid foundation."
    expected: "It emits a JSON lifecycle event with the task id and never emits an environment value."
    severity: medium
    planned_test: "app/web/tests/foundation.test.mjs > the verification command emits safe lifecycle events"
  - id: ECM-010
    category: PACKAGING
    trigger: "The standalone build is assembled in a clean Node 24 Alpine container."
    expected: "The Docker image build succeeds without a deployment or a running application process."
    severity: high
    planned_test: "docker build --tag sachviet-web-foundation:local app/web"
```

The matrix covers the foundation boundary only. Authentication, database, payments, integration, and migration cases belong to tasks that define those behaviors.
