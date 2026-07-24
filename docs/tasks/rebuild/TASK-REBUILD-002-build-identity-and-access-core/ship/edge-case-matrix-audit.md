# Edge-case matrix audit

```yaml
artefact: edge-case-matrix-audit@1
task_id: TASK-REBUILD-002
verdict: pass
row_count: 10
security_rows: [ECM-001, ECM-004, ECM-005, ECM-006, ECM-007, ECM-008, ECM-009]
```

Each authentication decision has a failure path, a deterministic outcome, and a named test. The matrix requires no human decision because the approved defaults define the local credentials and deployment-secret boundary.
