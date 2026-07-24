# Coverage gate

```yaml
artefact: coverage-gate@1
task_id: TASK-REBUILD-001
generated_at: "2026-07-24T00:00:00Z"
tests_failed: 0
coverage_threshold_pct: 90
coverage:
  - file: app/web/scripts/verify-foundation.mjs
    line_pct: 96.20
    branch_pct: 96.00
    function_pct: 100.00
files_below_90pct: []
ecm_rows_uncovered: []
edge_case_evidence:
  ECM-001: "foundation.test.mjs success case and gate commands pass without .env"
  ECM-002: "foundation.test.mjs architecture-boundary failure case"
  ECM-003: "foundation.test.mjs CapRover schema failure case"
  ECM-004: "foundation.test.mjs package metadata failure cases"
  ECM-005: "foundation.test.mjs missing required file failure case"
  ECM-006: "app/.gitignore and app/web/.gitignore inspected by the verifier and review"
  ECM-007: "foundation.test.mjs redacted .env failure event"
  ECM-008: "npm --prefix app/web audit --audit-level=high reported no vulnerabilities"
  ECM-009: "foundation.test.mjs lifecycle event case"
  ECM-010: "docker build --tag sachviet-web-foundation:local app/web passed"
```

Raw coverage command output:

```text
> sachviet-web@0.1.0 test:coverage
> node --test --experimental-test-coverage tests/*.test.mjs

tests 6
pass 6
fail 0

file                               line %   branch %   funcs %
scripts/verify-foundation.mjs      96.20    96.00      100.00
all files                          96.20    96.00      100.00
```

The Next.js pages and config are compiled by the passing production build. The only branch-bearing task logic is the verifier, and its coverage exceeds the 90% threshold.
