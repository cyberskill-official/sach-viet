# Human acceptance policy

CyberOS requires a recorded human verdict at both acceptance transitions:

- `reviewing` → `ready_to_test`
- `testing` → `done`

Agents may prepare evidence and run machine gates, but they must not author a human verdict or cross either transition on their own. Historical standing orders, blanket approvals, bypass notes, and remembered waivers are expired and do not authorize new work.

## Verdict record

The human reviewer adds an immutable JSON file beside the task:

```text
docs/tasks/<module>/<TASK-ID-slug>/verdicts/review-<date-or-unique-id>.json
docs/tasks/<module>/<TASK-ID-slug>/verdicts/final-<date-or-unique-id>.json
```

Required fields:

```json
{
  "schemaVersion": 1,
  "taskId": "TASK-EXAMPLE-001",
  "gate": "final",
  "from": "testing",
  "to": "done",
  "verdict": "accepted",
  "actor": { "type": "human", "name": "Reviewer name" },
  "decidedAt": "2026-07-25T14:00:00Z",
  "reason": "Reviewed the stated evidence and accepted the result."
}
```

Review verdicts use `gate: "review"`, `from: "reviewing"`, and `to: "ready_to_test"`.

`app/web/scripts/require-hitl-verdict.mjs` compares two Git revisions and fails closed when an acceptance transition lacks a newly added, matching verdict record. CI runs this check for pull requests and pushes. This is practical provenance enforcement, not a cryptographic proof that the named person created the file; branch protection and human review remain necessary.

## Local checks

From the repository root:

```bash
node app/web/scripts/require-hitl-verdict.mjs --base <base-commit>
node app/web/scripts/check-cyberos-install.mjs
```

The CyberOS check compares the ignored local install with `cyberos-install.json` and verifies that the local gate runner uses argv execution rather than `eval`.
