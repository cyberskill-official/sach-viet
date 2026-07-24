---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/security/TASK-SECURITY-001-retire-maintenance-endpoints/spec.md"
audited_file_sha256: "d2e10f0442f77dd67ece8e65425f1466c187c2ded87af44a393cac2e1bc8abbf"
audited_body_sha256: "865da3857902a31dbcbd15db843434f68cdcca81e11a5d47d22fc1df42ded12e"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-23T04:18:53Z"
overall_status: "pass"
iterations: 2
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "3b7bdd25-5318-4427-9093-3953ad49572a"
caller_persona: "cuo-cpo"
---

# TASK-SECURITY-001 audit

The machine floor returned no error-severity findings. Its TRACE-001 informational result is expected because this task uses the `task@1` profile rather than numbered engineering-spec clauses. <!-- authority: llm-explicit -->

The manual audit checked the maintenance-endpoint scope against the roadmap, role, and project-constraint references, source limits, metric authority, dependency boundaries, provenance, and staleness. The primary source hash matches the author manifest and task provenance. <!-- authority: llm-explicit -->

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
resolved_at: "2026-07-23T04:18:53Z"
opened_at: "2026-07-23T04:18:53Z"
updated_at: "2026-07-23T04:18:53Z"

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
resolved_at: "2026-07-23T04:18:53Z"
opened_at: "2026-07-23T04:18:53Z"
updated_at: "2026-07-23T04:18:53Z"

ISSUE
id: ISS-003
rule_id: QA-004
status: fixed
severity: warning
evidence: "The source reports exposed endpoints but supplies no calendar delivery date."
description: "The metric needs a completion boundary without inventing a date."
suggestion: "Use the task lifecycle testing-to-done gate as the deadline."
auto_fix_applied: true
diff_hunk: |
  + Deadline: before this task moves from testing to done
resolution: "Both metrics state baseline, target, and workflow deadline."
resolved_at: "2026-07-23T04:18:53Z"
opened_at: "2026-07-23T04:18:53Z"
updated_at: "2026-07-23T04:18:53Z"

ISSUE
id: ISS-004
rule_id: QA-006
status: fixed
severity: warning
evidence: "The source distinguishes exposed maintenance endpoints from HMAC-protected internal automation routes but does not establish route methods, callers, or replacement operations."
description: "Scope must prevent the task from removing an unsupported route set or inventing a replacement."
suggestion: "Retire only the recovered maintenance set and record an evidence gap if callers or required operations are unclear."
auto_fix_applied: true
diff_hunk: |
  + do not remove every HMAC internal route
resolution: "The task is limited to source-confirmed exposed maintenance endpoints."
resolved_at: "2026-07-23T04:18:53Z"
opened_at: "2026-07-23T04:18:53Z"
updated_at: "2026-07-23T04:18:53Z"

ISSUE
id: ISS-005
rule_id: QA-008
status: fixed
severity: warning
evidence: "The roadmap requires verified vendor-dashboard completion before endpoint retirement, and one named vendor prerequisite still needs an owner-backed KPI decision."
description: "The task must express its known prerequisite chain without inventing an external-team commitment."
suggestion: "Depend on TASK-VENDOR-001 and TASK-VENDOR-002 and state that implementation cannot start before both are complete."
auto_fix_applied: true
diff_hunk: |
  + depends_on: TASK-VENDOR-001, TASK-VENDOR-002
resolution: "The approved plan records both prerequisites, and the task has no unnamed external dependency."
resolved_at: "2026-07-23T04:18:53Z"
opened_at: "2026-07-23T04:18:53Z"
updated_at: "2026-07-23T04:18:53Z"

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The task needs source links for the exposed route issue, HMAC controls, and project constraints."
description: "Chained-task provenance must point to a manifest source file and its current hash."
suggestion: "Use docs/07-status-roadmap.md as the primary provenance source."
auto_fix_applied: true
diff_hunk: |
  + source_path: docs/07-status-roadmap.md
  + source_hash: 2104f7ddad7ac430bfa2629d9a2708477e8f3d9e1f4520bbde5545c894ff9fb3
resolution: "Provenance now matches the manifest source file and hash."
resolved_at: "2026-07-23T04:18:53Z"
opened_at: "2026-07-23T04:18:53Z"
updated_at: "2026-07-23T04:18:53Z"

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 2
next_action: ship
