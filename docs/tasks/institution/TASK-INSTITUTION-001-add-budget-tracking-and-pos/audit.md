---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/institution/TASK-INSTITUTION-001-add-budget-tracking-and-pos/spec.md"
audited_file_sha256: "c0d90d84763853c0ba59d8477d1387086f532d89f1e87645cf920f1976e4d255"
audited_body_sha256: "dc7e302231afa272477104865c92096293ad9ecbe5d2598d0a39541e175cb063"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-23T05:53:59Z"
overall_status: "pass"
iterations: 2
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "3b7bdd25-5318-4427-9093-3953ad49572a"
caller_persona: "cuo-cpo"
---

# TASK-INSTITUTION-001 audit

The machine floor returned no error-severity findings. Its TRACE-001 informational result is expected because this task uses the `task@1` profile rather than numbered engineering-spec clauses. <!-- authority: llm-explicit -->

The manual audit checked the informational budget boundary, purchase-order dependency, role scope, metrics, source provenance, and owner-decision gates against the institution, B2B, roadmap, and project-constraint references. The primary source hash matches the author manifest and task provenance. <!-- authority: llm-explicit -->

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
resolved_at: "2026-07-23T05:53:59Z"
opened_at: "2026-07-23T05:53:59Z"
updated_at: "2026-07-23T05:53:59Z"

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
resolved_at: "2026-07-23T05:53:59Z"
opened_at: "2026-07-23T05:53:59Z"
updated_at: "2026-07-23T05:53:59Z"

ISSUE
id: ISS-003
rule_id: QA-004
status: fixed
severity: warning
evidence: "The sources report a display-only institution dashboard and undesigned budget or PO tracking, but provide no calendar delivery date."
description: "The metrics need a baseline, a bounded target, and a completion boundary without inventing a date."
suggestion: "Use the task lifecycle testing-to-done gate as the deadline."
auto_fix_applied: true
diff_hunk: |
  + Deadline: before this task moves from testing to done
resolution: "Both metrics state their baseline, target, and workflow deadline."
resolved_at: "2026-07-23T05:53:59Z"
opened_at: "2026-07-23T05:53:59Z"
updated_at: "2026-07-23T05:53:59Z"

ISSUE
id: ISS-004
rule_id: QA-006
status: fixed
severity: warning
evidence: "The sources do not establish a budget ledger, financial commitment, approval policy, purchase-order format, file store, or retention rule."
description: "The task must keep the budget informational and condition any file artifact on the upstream B2B contract."
suggestion: "Exclude financial and policy behavior, and require an evidence gap when a recovered contract is absent."
auto_fix_applied: true
diff_hunk: |
  + must not make a financial commitment
  + TASK-B2B-003 becomes an additional dependency only when the recovered workflow requires a purchase-order file artifact
resolution: "The final scope has a bounded informational workflow and records all absent contracts as owner-decision gates."
resolved_at: "2026-07-23T05:53:59Z"
opened_at: "2026-07-23T05:53:59Z"
updated_at: "2026-07-23T05:53:59Z"

ISSUE
id: ISS-005
rule_id: QA-008
status: fixed
severity: warning
evidence: "The proposed workflow could otherwise rely on an unnamed finance, legal, or storage owner."
description: "The task must make the recovered B2B conversion contract and any operator decision its only prerequisites."
suggestion: "Use TASK-B2B-002 as the implementation dependency and leave financial, legal, storage, and approval policy outside scope."
auto_fix_applied: true
diff_hunk: |
  + TASK-B2B-002 must recover the accepted quote-to-order relation
resolution: "The dependency section does not imply an unrecorded external commitment."
resolved_at: "2026-07-23T05:53:59Z"
opened_at: "2026-07-23T05:53:59Z"
updated_at: "2026-07-23T05:53:59Z"

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The task needs source links for the institution portal, documented organization and role model, roadmap gap, and project constraints."
description: "Chained-task provenance must point to a manifest source file and its current hash."
suggestion: "Use docs/03-portals.md as the primary provenance source."
auto_fix_applied: true
diff_hunk: |
  + source_path: docs/03-portals.md
  + source_hash: 5be2732cfbbdd1093172b9070afd37a2617a6f569e1fd49d28bc7e3404880485
resolution: "Provenance now matches the manifest source file and hash."
resolved_at: "2026-07-23T05:53:59Z"
opened_at: "2026-07-23T05:53:59Z"
updated_at: "2026-07-23T05:53:59Z"

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 2
next_action: ship
