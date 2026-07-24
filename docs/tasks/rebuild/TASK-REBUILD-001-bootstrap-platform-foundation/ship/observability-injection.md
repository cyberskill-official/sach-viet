# Observability injection

```yaml
artefact: observability-injection@1
task_id: TASK-REBUILD-001
generated_at: "2026-07-24T00:00:00Z"
language: javascript
subscriber: "structured JSON written to standard output by the non-runtime foundation verifier"
log_points:
  - id: LOG-001
    file: app/web/scripts/verify-foundation.mjs
    line_hint: 20
    level: info
    message_shape: "foundation_verification_started {task_id,check_count}"
    carries: [task_id, check_count]
    when: "The verifier begins its static checks."
  - id: LOG-002
    file: app/web/scripts/verify-foundation.mjs
    line_hint: 67
    level: info
    message_shape: "foundation_verification_completed {task_id,application,next_version}"
    carries: [task_id, application, next_version]
    when: "All static checks pass."
  - id: LOG-003
    file: app/web/scripts/verify-foundation.mjs
    line_hint: 70
    level: error
    message_shape: "foundation_verification_failed {task_id,check_id,error_class}"
    carries: [task_id, check_id, error_class]
    when: "A required file, metadata field, package boundary, or environment-file check fails."
trace_spans: []
error_counters: []
branch_coverage:
  measured_command: "npm run test:coverage"
  line_coverage_pct: 96.20
  branch_coverage_pct: 96.00
redaction_policy:
  - field_pattern: "password|secret|token|key|environment_value|path"
    action: "not-emitted"
  - field_pattern: "email|phone|name"
    action: "not-collected"
```

The verifier only reads local static files. It does not start an application, call an external service, collect tenant or subject data, or publish telemetry beyond its own process output.
