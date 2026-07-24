# Backlog state update

```yaml
artefact: backlog-state-update@2
task_id: TASK-REBUILD-002
prior_status: reviewing
new_status: ready_to_test
transition_kind: human_review_approved
approval: "APPROVE REVIEW"
evidence_artefact_ids:
  code_review: code-review@1
rework_reason: null
```

The operator approved the review packet. The task may move into final testing. The local Docker daemon remains unavailable, so the image rebuild has not been re-attempted.
