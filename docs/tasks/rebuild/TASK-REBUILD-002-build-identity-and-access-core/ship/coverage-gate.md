# Coverage gate

```yaml
artefact: coverage-gate@1
task_id: TASK-REBUILD-002
command: "npm --prefix app/web run test:coverage"
tests: 17
passed: 17
failed: 0
coverage:
  all_lines: 93.18
  auth_core_lines: 91.30
  access_lines: 93.62
  identity_verifier_lines: 95.83
threshold: 90
verdict: pass
```

The test suite covers password hashing, bootstrap idempotency, per-email throttling, signed sessions, expiry, logout, role mapping, ownership, safe redirects, and verification failures. The touched JavaScript implementation files meet the 90 percent line-coverage threshold.
