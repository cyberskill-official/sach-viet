# Coverage gate audit

```yaml
artefact: coverage-gate-audit@1
task_id: TASK-REBUILD-001
audited_artefact: ship/coverage-gate.md
generated_at: "2026-07-24T00:00:00Z"
score: 10
verdict: PASS
tests_failed: 0
files_below_90pct: []
ecm_rows_uncovered: []
trace_closure:
  status: pass
  evidence: "The task uses task@1 without numbered acceptance clauses, so TRACE-001 is informational and the success metrics are covered by the gate commands and verifier tests."
rules:
  - id: CG-001
    verdict: pass
    evidence: "Six Node tests passed with zero failures."
  - id: CG-002
    verdict: pass
    evidence: "The verifier has 96.20% line and 96.00% branch coverage, above the 90% threshold."
  - id: CG-003
    verdict: pass
    evidence: "Every edge-case-matrix row has an executable test, verification command, audit command, or Docker build evidence."
  - id: CG-004
    verdict: pass
    evidence: "The raw coverage output is present and not truncated."
  - id: CG-005
    verdict: pass
    evidence: "The build, lint, dependency audit, compose validation, and Docker build are also green."
```

The coverage gate passes. No debugging cycle is required.
