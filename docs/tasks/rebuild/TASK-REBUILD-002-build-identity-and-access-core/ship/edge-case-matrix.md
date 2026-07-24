# Edge-case matrix

```yaml
artefact: edge-case-matrix@1
task_id: TASK-REBUILD-002
```

| ID | Condition | Expected outcome | Evidence |
| --- | --- | --- | --- |
| ECM-001 | Bootstrap inputs are absent or incomplete | No administrator is created and no secret is logged. | `auth-core.test.mjs` bootstrap tests |
| ECM-002 | Valid bootstrap inputs reach an empty user store | One administrator is created with the supplied password hash. | `auth-core.test.mjs` bootstrap test |
| ECM-003 | Bootstrap runs again after the first user exists | The user set remains unchanged. | `auth-core.test.mjs` idempotency test |
| ECM-004 | Login uses a wrong password | The request fails without creating a session. | `auth-core.test.mjs` failed-login test |
| ECM-005 | One normalized email exceeds the failed-login limit | Further attempts are rejected until the lock expires. | `auth-core.test.mjs` throttling test |
| ECM-006 | A session cookie signature is changed | The session is rejected. | `auth-core.test.mjs` cookie-integrity test |
| ECM-007 | A session reaches its expiry time | The authenticated user is unavailable and the session is removed. | `auth-core.test.mjs` expiry test |
| ECM-008 | A caller has a role outside a portal mapping | Authorization rejects the caller. | `auth-core.test.mjs` role-access test |
| ECM-009 | An owner-only record belongs to another user | Ownership authorization rejects the caller. | `auth-core.test.mjs` ownership test |
| ECM-010 | Login return target is external or malformed | The server redirects to the safe application path. | `auth-core.test.mjs` redirect test |

The matrix covers the authentication boundaries that later portal tasks will depend on. It does not add portal business behavior.
