# Observability injection plan

```yaml
artefact: observability-injection@1
task_id: TASK-REBUILD-002
```

| Path | Event | Fields allowed | Fields forbidden |
| --- | --- | --- | --- |
| First-admin bootstrap | `auth_bootstrap_completed` | result only | email, password hash, session secret |
| Login accepted | `auth_login_succeeded` | role, result | email, cookie, password hash |
| Login rejected | `auth_login_rejected` | reason class, result | email, password, hash |
| Login throttled | `auth_login_throttled` | result | email, password, hash |
| Session rejected | `auth_session_rejected` | reason class, result | cookie, session id, secret |
| Logout | `auth_logout_completed` | result | cookie, session id |

Authentication events use structured server logs with an outcome class only. They deliberately omit credentials, identifying email addresses, password hashes, session identifiers, and signing inputs.
