---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/employee/TASK-EMPLOYEE-002-add-real-dashboard-kpis/spec.md"
audited_file_sha256: "c46fad2537f35204673e6e1cfde39fdb5cd7c1d2d6732e2d446fe49f81b9a87f"
audited_body_sha256: "850e9cd304e926423150d97a12275b60d791168b93f5c051f85b70152e19d3a4"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-23T05:46:28Z"
overall_status: "pass"
iterations: 2
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "3b7bdd25-5318-4427-9093-3953ad49572a"
caller_persona: "cuo-cpo"
---

# TASK-EMPLOYEE-002 audit

The machine floor returned no error-severity findings. Its TRACE-001 informational result is expected because this task uses the `task@1` profile rather than numbered engineering-spec clauses. <!-- authority: llm-explicit -->

The manual audit checked the conflicting dashboard statements, the preserved approval queue, the source-discovery prerequisite, metric authority, provenance, and project constraints. The task treats recovered source as the final authority for each card. <!-- authority: llm-explicit -->

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
resolved_at: "2026-07-23T05:46:28Z"
opened_at: "2026-07-23T05:46:28Z"
updated_at: "2026-07-23T05:46:28Z"

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
resolved_at: "2026-07-23T05:46:28Z"
opened_at: "2026-07-23T05:46:28Z"
updated_at: "2026-07-23T05:46:28Z"

ISSUE
id: ISS-003
rule_id: QA-004
status: fixed
severity: warning
evidence: "The handoff supplies no calendar delivery date for employee dashboard work."
description: "The metrics need a completion boundary without inventing a date."
suggestion: "Use the task lifecycle testing-to-done gate as the deadline."
auto_fix_applied: true
diff_hunk: |
  + Deadline: before this task moves from testing to done
resolution: "Both metrics state a baseline, target, and workflow deadline."
resolved_at: "2026-07-23T05:46:28Z"
opened_at: "2026-07-23T05:46:28Z"
updated_at: "2026-07-23T05:46:28Z"

ISSUE
id: ISS-004
rule_id: QA-006
status: fixed
severity: warning
evidence: "The portal report says KPI cards are partially mocked while the roadmap says employee dashboards use an extended payload."
description: "The task must resolve the conflict without assuming that every dashboard card needs work."
suggestion: "Use the portal-specific report as the default boundary and require source recovery per card."
auto_fix_applied: true
diff_hunk: |
  + every card included in this task is either backed by its recovered source-confirmed data contract or recorded as an evidence gap
resolution: "The task makes the conflict visible and confines implementation to recovered mock cards."
resolved_at: "2026-07-23T05:46:28Z"
opened_at: "2026-07-23T05:46:28Z"
updated_at: "2026-07-23T05:46:28Z"

ISSUE
id: ISS-005
rule_id: QA-008
status: fixed
severity: warning
evidence: "Application source and the dashboard card inventory are absent from the documentation repository."
description: "The task needs a concrete prerequisite instead of an unnamed dependency."
suggestion: "Depend on TASK-DISCOVERY-001 and preserve the source-confirmed approval queue."
auto_fix_applied: true
diff_hunk: |
  + depends_on: TASK-DISCOVERY-001
  + approval-queue behavior is unchanged
resolution: "The task records the prerequisite and protected functionality without inventing an external commitment."
resolved_at: "2026-07-23T05:46:28Z"
opened_at: "2026-07-23T05:46:28Z"
updated_at: "2026-07-23T05:46:28Z"

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The task needs source links for the employee portal state, roadmap conflict, and project constraints."
description: "Chained-task provenance must point to a manifest source file and its current hash."
suggestion: "Use docs/03-portals.md as the primary provenance source."
auto_fix_applied: true
diff_hunk: |
  + source_path: docs/03-portals.md
  + source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485
resolution: "Provenance matches the manifest source file and hash."
resolved_at: "2026-07-23T05:46:28Z"
opened_at: "2026-07-23T05:46:28Z"
updated_at: "2026-07-23T05:46:28Z"

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 2
next_action: ship
