---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/institution/TASK-INSTITUTION-002-deliver-purchased-marc-records/spec.md"
audited_file_sha256: "428c2cddc2cf51f30645875e788f3b983f080eabd02ff6b35752d558c03bf921"
audited_body_sha256: "631a10b0701bcc2e136239ba6d2f80a7f085466e4eec2db631d782b194b5e28f"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-23T05:55:37Z"
overall_status: "pass"
iterations: 2
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "3b7bdd25-5318-4427-9093-3953ad49572a"
caller_persona: "cuo-cpo"
---

# TASK-INSTITUTION-002 audit

The machine floor returned no error-severity findings. Its TRACE-001 informational result is expected because this task uses the `task@1` profile rather than numbered engineering-spec clauses. <!-- authority: llm-explicit -->

The manual audit checked the purchase-entitlement gate, organization boundary, private-storage condition, omitted rights and format policy, metrics, and source provenance against the vision, portal, data-model, and project-constraint references. The primary source hash matches the author manifest and task provenance. <!-- authority: llm-explicit -->

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
resolved_at: "2026-07-23T05:55:37Z"
opened_at: "2026-07-23T05:55:37Z"
updated_at: "2026-07-23T05:55:37Z"

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
resolved_at: "2026-07-23T05:55:37Z"
opened_at: "2026-07-23T05:55:37Z"
updated_at: "2026-07-23T05:55:37Z"

ISSUE
id: ISS-003
rule_id: QA-004
status: fixed
severity: warning
evidence: "The sources name MARC delivery as a need but provide no calendar delivery date or entitlement baseline."
description: "The metrics need a source-based baseline, bounded target, and workflow deadline."
suggestion: "Use the task lifecycle testing-to-done gate as the deadline."
auto_fix_applied: true
diff_hunk: |
  + Deadline: before this task moves from testing to done
resolution: "Both metrics state their baseline, target, and workflow deadline."
resolved_at: "2026-07-23T05:55:37Z"
opened_at: "2026-07-23T05:55:37Z"
updated_at: "2026-07-23T05:55:37Z"

ISSUE
id: ISS-004
rule_id: QA-006
status: fixed
severity: warning
evidence: "The sources establish MARC upload and parsing but do not establish purchase entitlement, ownership, record storage, delivery format, or public access."
description: "The task must not convert a source gap into an invented record-delivery contract."
suggestion: "Gate delivery on a recovered purchase relation and existing private MARC storage, then record a gap when either is absent."
auto_fix_applied: true
diff_hunk: |
  + source-confirmed purchase entitlement
  + existing MARC subsystem and private storage only when discovery confirms both
resolution: "The final task allows only a recovered private delivery path and treats every absent contract as a stop condition."
resolved_at: "2026-07-23T05:55:37Z"
opened_at: "2026-07-23T05:55:37Z"
updated_at: "2026-07-23T05:55:37Z"

ISSUE
id: ISS-005
rule_id: QA-008
status: fixed
severity: warning
evidence: "Ownership, rights, retention, and delivery-format choices require an owner decision that no source records."
description: "The task must not imply legal or external delivery approval."
suggestion: "Defer those choices and require an evidence record before releasing a record when the source cannot establish the private path."
auto_fix_applied: true
diff_hunk: |
  + record the evidence gap for an owner decision and do not release a record
resolution: "The dependency section leaves legal, rights, retention, and format decisions outside implementation scope."
resolved_at: "2026-07-23T05:55:37Z"
opened_at: "2026-07-23T05:55:37Z"
updated_at: "2026-07-23T05:55:37Z"

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The task needs source links for the B2B broker model, institution MARC need, documented organization and role model, and project constraints."
description: "Chained-task provenance must point to a manifest source file and its current hash."
suggestion: "Use docs/01-vision.md as the primary provenance source."
auto_fix_applied: true
diff_hunk: |
  + source_path: docs/01-vision.md
  + source_hash: 85bd3a7365b7c6ed3eb5dc449e867b08316b23fb2b055db69a0d5ecb8f0cac23
resolution: "Provenance now matches the manifest source file and hash."
resolved_at: "2026-07-23T05:55:37Z"
opened_at: "2026-07-23T05:55:37Z"
updated_at: "2026-07-23T05:55:37Z"

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 2
next_action: ship
