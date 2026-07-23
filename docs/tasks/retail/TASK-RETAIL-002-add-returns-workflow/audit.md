---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/retail/TASK-RETAIL-002-add-returns-workflow/spec.md"
audited_file_sha256: "2130142580444c2fc64b69272864a311205a6d2b457c3ed8c3a6dcc3eb36f2c1"
audited_body_sha256: "2e8413c7ab30f1fc71c2117bb14ff698fa25359de63aea78c0e8fc852d38ba55"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-23T05:58:11Z"
overall_status: "pass"
iterations: 2
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "3b7bdd25-5318-4427-9093-3953ad49572a"
caller_persona: "cuo-cpo"
---

# TASK-RETAIL-002 audit

The machine floor returned no error-severity findings. Its TRACE-001 informational result is expected because this task uses the `task@1` profile rather than numbered engineering-spec clauses. <!-- authority: llm-explicit -->

The manual audit checked the missing returns backend, the existing order and order-item evidence, the retail role boundary, manual non-financial default, external policy gates, metric authority, provenance, and project constraints. The task does not add a refund program. <!-- authority: llm-explicit -->

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
resolved_at: "2026-07-23T05:58:11Z"
opened_at: "2026-07-23T05:58:11Z"
updated_at: "2026-07-23T05:58:11Z"

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
resolved_at: "2026-07-23T05:58:11Z"
opened_at: "2026-07-23T05:58:11Z"
updated_at: "2026-07-23T05:58:11Z"

ISSUE
id: ISS-003
rule_id: QA-004
status: fixed
severity: warning
evidence: "The handoff supplies no calendar delivery date for the returns workflow."
description: "The metrics need a completion boundary without inventing a date."
suggestion: "Use the task lifecycle testing-to-done gate as the deadline."
auto_fix_applied: true
diff_hunk: |
  + Deadline: before this task moves from testing to done
resolution: "Both metrics state a baseline, target, and workflow deadline."
resolved_at: "2026-07-23T05:58:11Z"
opened_at: "2026-07-23T05:58:11Z"
updated_at: "2026-07-23T05:58:11Z"

ISSUE
id: ISS-004
rule_id: QA-006
status: fixed
severity: warning
evidence: "The source says the returns page has no backend and does not define a return entity, states, refunds, eligibility, shipping, or customer service."
description: "The task must avoid inventing a returns program."
suggestion: "Use a manual non-financial staff case only when a recovered storage path exists, otherwise record the gap."
auto_fix_applied: true
diff_hunk: |
  + If the recovered application has no supported private storage path for the manual case, record the data-model gap and stop before inventing a new schema.
resolution: "The task has a limited manual scope and clear exclusions for policy-heavy behavior."
resolved_at: "2026-07-23T05:58:11Z"
opened_at: "2026-07-23T05:58:11Z"
updated_at: "2026-07-23T05:58:11Z"

ISSUE
id: ISS-005
rule_id: QA-008
status: fixed
severity: warning
evidence: "The return-case storage and retail order context require the preceding recovered retail work."
description: "The task needs a concrete prerequisite rather than an unnamed operational dependency."
suggestion: "Depend on TASK-RETAIL-001 before implementing a return case."
auto_fix_applied: true
diff_hunk: |
  + depends_on: TASK-RETAIL-001
resolution: "The task has an explicit upstream task and leaves policy decisions with the owner."
resolved_at: "2026-07-23T05:58:11Z"
opened_at: "2026-07-23T05:58:11Z"
updated_at: "2026-07-23T05:58:11Z"

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The task needs source links for the retail portal state, role guards, order relationships, roadmap gap, and project constraints."
description: "Chained-task provenance must point to a manifest source file and its current hash."
suggestion: "Use docs/03-portals.md as the primary provenance source."
auto_fix_applied: true
diff_hunk: |
  + source_path: docs/03-portals.md
  + source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485
resolution: "Provenance matches the manifest source file and hash."
resolved_at: "2026-07-23T05:58:11Z"
opened_at: "2026-07-23T05:58:11Z"
updated_at: "2026-07-23T05:58:11Z"

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 2
next_action: ship
