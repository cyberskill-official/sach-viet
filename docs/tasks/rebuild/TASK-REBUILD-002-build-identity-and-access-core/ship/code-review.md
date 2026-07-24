# Code review

```yaml
artefact: code-review@1
task_id: TASK-REBUILD-002
verdict: pass_with_environment_note
```

| Review area | Result | Evidence |
| --- | --- | --- |
| Password handling | Pass | Passwords are scrypt hashes and the API never returns a password or hash. |
| Browser session boundary | Pass | The only session value is an opaque `HttpOnly`, `SameSite=Lax` cookie. |
| Session integrity | Pass | Cookie identifiers have an HMAC signature, are server stored, expire, and revoke on logout. |
| Login abuse control | Pass | Failed attempts use normalized-email throttling with a timed lock. |
| Authorization | Pass | Server helpers implement the documented single-role portal mapping and reusable ownership checks. |
| Bootstrap safety | Pass | Bootstrap reads only runtime inputs, creates one administrator in an empty store, and logs no sensitive values. |
| Test evidence | Pass | Node tests cover each row in the edge-case matrix; repository gates are green. |
| Production image | Environment note | Docker configuration validates, but the local Docker daemon is unavailable, so the changed image could not be built in this session. |

No source change is required by the review. The Docker daemon note is an environment limitation, not a failed application check or a deployment attempt.
