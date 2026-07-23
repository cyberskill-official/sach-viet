---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/notifications/TASK-NOTIFICATIONS-001-verify-notification-bell/spec.md"
audited_file_sha256: "5204ddffd9fd1d43b6d08d3299fbe44f1f347597288fd4da4658d8c14d81af30"
audited_body_sha256: "77e43d465408e5d64d23da8c54a5ed62e5a9da142cffb48dabe4bb4fb2183c6a"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-23T04:05:59Z"
overall_status: "pass"
iterations: 2
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "3b7bdd25-5318-4427-9093-3953ad49572a"
caller_persona: "cuo-cpo"
---

# TASK-NOTIFICATIONS-001 audit

The machine floor returned no error-severity findings. Its TRACE-001 informational result is expected because this task uses the `task@1` profile rather than numbered engineering-spec clauses. <!-- authority: llm-explicit -->

The manual audit checked the notification-verification scope against the portal, roadmap, and stack references, source limits, access boundaries, metric authority, dependencies, provenance, and staleness. The primary source hash matches the author manifest and task provenance. <!-- authority: llm-explicit -->

ISSUE
id: ISS-001
rule_id: FM-107
status: fixed
severity: warning
evidence: "The task needs an AI authorship value that does not claim a completed human review."
description: "AI-assisted authoring must remain distinguishable from an operator review."
suggestion: "Use assisted and retain the Human review disclosure."
auto_fix_applied: true
diff_hunk: |
  + ai_authorship: assisted
resolution: "The final frontmatter accurately records assisted authorship."
resolved_at: "2026-07-23T04:05:59Z"
opened_at: "2026-07-23T04:05:59Z"
updated_at: "2026-07-23T04:05:59Z"

ISSUE
id: ISS-002
rule_id: COND-004
status: fixed
severity: warning
evidence: "An assisted task needs all required disclosure labels."
description: "The task must state tools, scope, and remaining human review."
suggestion: "Keep the required three labeled bullets."
auto_fix_applied: true
diff_hunk: |
  + Tools used
  + Scope
  + Human review
resolution: "The disclosure is complete and aligned with the authorship field."
resolved_at: "2026-07-23T04:05:59Z"
opened_at: "2026-07-23T04:05:59Z"
updated_at: "2026-07-23T04:05:59Z"

ISSUE
id: ISS-003
rule_id: QA-004
status: fixed
severity: warning
evidence: "The sources state pending verification across five portals but no calendar delivery date."
description: "The metric needs a completion boundary without inventing a date."
suggestion: "Use the task lifecycle testing-to-done gate as the deadline."
auto_fix_applied: true
diff_hunk: |
  + Deadline: before this task moves from testing to done
resolution: "Both metrics state baseline, target, and workflow deadline."
resolved_at: "2026-07-23T04:05:59Z"
opened_at: "2026-07-23T04:05:59Z"
updated_at: "2026-07-23T04:05:59Z"

ISSUE
id: ISS-004
rule_id: QA-006
status: fixed
severity: warning
evidence: "The source confirms pending badge and deeplink verification but does not name routes, accounts, expected results, or a portal list."
description: "Scope must prevent the task from inventing notification behavior or test data."
suggestion: "Recover the verification contract and record an evidence gap when it cannot be established."
auto_fix_applied: true
diff_hunk: |
  + record the evidence or access gap instead of inventing a test result
resolution: "The task is limited to source-confirmed behavior and secure approved test access."
resolved_at: "2026-07-23T04:05:59Z"
opened_at: "2026-07-23T04:05:59Z"
updated_at: "2026-07-23T04:05:59Z"

ISSUE
id: ISS-005
rule_id: QA-008
status: fixed
severity: warning
evidence: "Preview verification needs owner test access, which is not present in the repository."
description: "The task must distinguish an execution access precondition from an unrecorded external-team commitment."
suggestion: "Require secure approved test access and record its absence without requesting or storing credentials."
auto_fix_applied: true
diff_hunk: |
  + Approved owner test access is an execution precondition
resolution: "The task does not name an external-team dependency or store credential material."
resolved_at: "2026-07-23T04:05:59Z"
opened_at: "2026-07-23T04:05:59Z"
updated_at: "2026-07-23T04:05:59Z"

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The task needs source links for notification state, pending verification, real-time separation, and project constraints."
description: "Chained-task provenance must point to a manifest source file and its current hash."
suggestion: "Use docs/03-portals.md as the primary provenance source."
auto_fix_applied: true
diff_hunk: |
  + source_path: docs/03-portals.md
  + source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485
resolution: "Provenance now matches the manifest source file and hash."
resolved_at: "2026-07-23T04:05:59Z"
opened_at: "2026-07-23T04:05:59Z"
updated_at: "2026-07-23T04:05:59Z"

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 2
next_action: ship
