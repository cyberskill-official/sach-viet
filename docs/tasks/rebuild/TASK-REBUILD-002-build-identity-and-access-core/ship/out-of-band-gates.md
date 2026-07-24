# Out-of-band gate status

```yaml
artefact: out-of-band-gates@1
task_id: TASK-REBUILD-002
awh:
  enabled: false
  verdict: skipped_conditional
caf:
  enabled: false
  verdict: skipped_conditional
```

The repository has neither AWH nor CAF enabled in `.cyberos/gates.env`, so neither optional gate ran. The configured build, lint, test, and coverage gates passed.
