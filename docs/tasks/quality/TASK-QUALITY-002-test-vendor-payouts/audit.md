---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/quality/TASK-QUALITY-002-test-vendor-payouts/spec.md"
audited_file_sha256: "abaf2cf2a7b1d45bd03e7c134b37566160e88c8c4c15aabc679bef348f9ae756"
audited_body_sha256: "8e7c462a73569681b47c4b28a9b9df865b64e50275615c0a1207614eb7ce9cb7"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-23T03:55:08Z"
overall_status: "pass"
iterations: 2
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "3b7bdd25-5318-4427-9093-3953ad49572a"
caller_persona: "cuo-cpo"
---

# TASK-QUALITY-002 audit

The machine floor returned no error-severity findings. Its TRACE-001 informational result is expected because this task uses the `task@1` profile rather than numbered engineering-spec clauses. <!-- authority: llm-explicit -->

The manual audit checked the payout scope against the available data-model references, source limits, safe-data boundaries, metric authority, dependencies, provenance, and staleness. The primary source hash matches the author manifest and the task provenance. <!-- authority: llm-explicit -->

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
resolved_at: "2026-07-23T03:55:08Z"
opened_at: "2026-07-23T03:55:08Z"
updated_at: "2026-07-23T03:55:08Z"

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
resolved_at: "2026-07-23T03:55:08Z"
opened_at: "2026-07-23T03:55:08Z"
updated_at: "2026-07-23T03:55:08Z"

ISSUE
id: ISS-003
rule_id: QA-004
status: fixed
severity: warning
evidence: "The sources establish a thin-testing baseline but no calendar delivery date."
description: "The metric needs a completion boundary without inventing a date."
suggestion: "Use the task lifecycle testing-to-done gate as the deadline."
auto_fix_applied: true
diff_hunk: |
  + Deadline: before this task moves from testing to done
resolution: "Both metrics state baseline, target, and workflow deadline."
resolved_at: "2026-07-23T03:55:08Z"
opened_at: "2026-07-23T03:55:08Z"
updated_at: "2026-07-23T03:55:08Z"

ISSUE
id: ISS-004
rule_id: QA-006
status: fixed
severity: warning
evidence: "The source describes a settlement relationship but not payout states, calculation rules, endpoints, or test paths."
description: "Scope must prevent a regression task from making unsupported payout claims."
suggestion: "Limit coverage to source-visible behavior and record evidence gaps."
auto_fix_applied: true
diff_hunk: |
  + record an evidence gap instead of creating a test scenario
resolution: "The task is limited to observed behavior from the recovered source."
resolved_at: "2026-07-23T03:55:08Z"
opened_at: "2026-07-23T03:55:08Z"
updated_at: "2026-07-23T03:55:08Z"

ISSUE
id: ISS-005
rule_id: QA-008
status: fixed
severity: warning
evidence: "Payout work could be mistaken for a dependency on a provider or unidentified team."
description: "The task must not require an unrecorded external commitment."
suggestion: "Depend on source discovery and use isolated data instead of live access."
auto_fix_applied: true
diff_hunk: |
  + discovery result rather than a dependency on an unnamed team or provider contact
resolution: "The only dependency is the discovery task and no external-team claim remains."
resolved_at: "2026-07-23T03:55:08Z"
opened_at: "2026-07-23T03:55:08Z"
updated_at: "2026-07-23T03:55:08Z"

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The task needs source links for the payout model, testing status, admin capability, and ground rules."
description: "Chained-task provenance must point to a manifest source file and its current hash."
suggestion: "Use docs/05-data-model.md as the primary provenance source."
auto_fix_applied: true
diff_hunk: |
  + source_path: docs/05-data-model.md
  + source_hash: 6c59dd10d4d5e9ba1fe5ae8313f51428b1f6bd8d7b6176b49dc223e5192c8b1c
resolution: "Provenance now matches the manifest source file and hash."
resolved_at: "2026-07-23T03:55:08Z"
opened_at: "2026-07-23T03:55:08Z"
updated_at: "2026-07-23T03:55:08Z"

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 2
next_action: ship
