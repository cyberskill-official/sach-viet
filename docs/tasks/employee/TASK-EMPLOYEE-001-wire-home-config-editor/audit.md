---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/employee/TASK-EMPLOYEE-001-wire-home-config-editor/spec.md"
audited_file_sha256: "f26d2009744776202d00cc875734c7525caa017a1750c200c01f286ddc76b658"
audited_body_sha256: "6ef3c40c3c7ee46576b90855567bf698db211b5d0b6c19f9e9f64a4ab39c8f07"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-23T04:03:50Z"
overall_status: "pass"
iterations: 2
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "3b7bdd25-5318-4427-9093-3953ad49572a"
caller_persona: "cuo-cpo"
---

# TASK-EMPLOYEE-001 audit

The machine floor returned no error-severity findings. Its TRACE-001 informational result is expected because this task uses the `task@1` profile rather than numbered engineering-spec clauses. <!-- authority: llm-explicit -->

The manual audit checked the employee editor scope against the portal and roadmap references, source limits, metric authority, dependencies, provenance, and staleness. The primary source hash matches the author manifest and task provenance. <!-- authority: llm-explicit -->

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
resolved_at: "2026-07-23T04:03:50Z"
opened_at: "2026-07-23T04:03:50Z"
updated_at: "2026-07-23T04:03:50Z"

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
resolved_at: "2026-07-23T04:03:50Z"
opened_at: "2026-07-23T04:03:50Z"
updated_at: "2026-07-23T04:03:50Z"

ISSUE
id: ISS-003
rule_id: QA-004
status: fixed
severity: warning
evidence: "The source states a disconnected editor but supplies no calendar delivery date."
description: "The metric needs a completion boundary without inventing a date."
suggestion: "Use the task lifecycle testing-to-done gate as the deadline."
auto_fix_applied: true
diff_hunk: |
  + Deadline: before this task moves from testing to done
resolution: "Both metrics state baseline, target, and workflow deadline."
resolved_at: "2026-07-23T04:03:50Z"
opened_at: "2026-07-23T04:03:50Z"
updated_at: "2026-07-23T04:03:50Z"

ISSUE
id: ISS-004
rule_id: QA-006
status: fixed
severity: warning
evidence: "The source confirms a disconnected UI but does not establish a backend endpoint, model, payload, or policy."
description: "Scope must prevent the task from inventing a configuration contract."
suggestion: "Connect only to a recovered contract and record an evidence gap if none exists."
auto_fix_applied: true
diff_hunk: |
  + record the evidence gap and request a product or design decision
resolution: "The task is limited to source-confirmed behavior and has a bounded outcome when the contract is absent."
resolved_at: "2026-07-23T04:03:50Z"
opened_at: "2026-07-23T04:03:50Z"
updated_at: "2026-07-23T04:03:50Z"

ISSUE
id: ISS-005
rule_id: QA-008
status: fixed
severity: warning
evidence: "Editor work could be mistaken for a dependency on an unidentified owner or team."
description: "The task must not require an unrecorded external commitment."
suggestion: "Depend on source discovery and raise a decision only if the recovered source has no contract."
auto_fix_applied: true
diff_hunk: |
  + discovery result rather than a dependency on an unnamed team
resolution: "The only dependency is the discovery task and no external-team claim remains."
resolved_at: "2026-07-23T04:03:50Z"
opened_at: "2026-07-23T04:03:50Z"
updated_at: "2026-07-23T04:03:50Z"

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The task needs source links for the employee portal state, first-work guidance, architecture, and project constraints."
description: "Chained-task provenance must point to a manifest source file and its current hash."
suggestion: "Use docs/03-portals.md as the primary provenance source."
auto_fix_applied: true
diff_hunk: |
  + source_path: docs/03-portals.md
  + source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485
resolution: "Provenance now matches the manifest source file and hash."
resolved_at: "2026-07-23T04:03:50Z"
opened_at: "2026-07-23T04:03:50Z"
updated_at: "2026-07-23T04:03:50Z"

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 2
next_action: ship
