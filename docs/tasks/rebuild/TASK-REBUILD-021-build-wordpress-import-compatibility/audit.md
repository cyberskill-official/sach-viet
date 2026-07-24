---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-021-build-wordpress-import-compatibility/spec.md"
audited_file_sha256: "727a12f2f759fb7ef51b3a7f40d65d332a8286545b98131fbc171afbfe055e6b"
audited_body_sha256: "399637ac9f90a07b884385bb5097ddeaa30c465a06c541b46ff2a47099114e03"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T13:37:00Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-021"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-021 audit

Verdict: pass. The task rebuilds documented WordPress import compatibility as a greenfield fixture-driven adapter with PHPass verify, legacy identifiers, billing-email + total-amount order matching, dry_run/apply outcomes, and admin-gated apply — without reviving a WordPress PHP runtime, connecting to live WP MySQL, or reopening on-hold migration/cutover work. <!-- authority: human-confirmed -->

ISSUE
id: ISS-001
rule_id: FM-107
status: fixed
severity: warning
evidence: "The task is Codex-assisted."
description: "Assisted authorship requires an explicit disclosure."
suggestion: "Keep the tool, scope, and review disclosure."
auto_fix_applied: true
resolution: "The disclosure identifies all three required parts."

ISSUE
id: ISS-002
rule_id: SEC-005
status: fixed
severity: warning
evidence: "Import stores PHPass hashes and extends login verification."
description: "Password material and hash strings must not leak into logs or import outcome rows."
suggestion: "Forbid logging plaintext passwords or full hash material; keep structured events outcome-only."
auto_fix_applied: true
resolution: "The proposed solution forbids inventing plaintext passwords or logging hash material; outcomes are accepted/skipped/unmatched/rejected only."

ISSUE
id: ISS-003
rule_id: COND-004
status: fixed
severity: warning
evidence: "Legacy WpImport and live WP MySQL are unavailable / out of band under greenfield-only."
description: "Import must have a closed default that does not require live WordPress connectivity."
suggestion: "Require fixture-driven dry_run/apply with no MySQL client in the default path."
auto_fix_applied: true
resolution: "The proposed solution and success metric require JSON fixtures, dry_run/apply, and no live MySQL for CI."

ISSUE
id: ISS-004
rule_id: QA-004
status: fixed
severity: warning
evidence: "Embedding WordPress PHP or recovering Laravel WpImport would revive legacy as product."
description: "The task must not ship a WordPress runtime or unavailable legacy command as the product app."
suggestion: "Reject WP PHP runtime and Laravel WpImport recovery in alternatives/out-of-scope."
auto_fix_applied: true
resolution: "Alternatives and out-of-scope explicitly reject WordPress runtime revival and Laravel WpImport recovery."

ISSUE
id: ISS-005
rule_id: QA-006
status: fixed
severity: warning
evidence: "TASK-MIGRATION-001 and cutover tasks are on_hold; Task 2/5 ownership must remain intact."
description: "Import compatibility must not reopen migration/cutover or rewrite auth/commerce ownership."
suggestion: "Limit mutation to minimal schema/verify extensions; leave on_hold tasks and prior cores alone."
auto_fix_applied: true
resolution: "Scope and guardrail require leaving MIGRATION/CUTOVER on_hold and limiting Task 2/5 changes to legacy ids + PHPass verify."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The approved rebuild manifest reserves Task 21 for WordPress import compatibility."
description: "The task must retain source and manifest provenance."
suggestion: "Preserve source references, greenfield decision, import decision, and related on_hold pointers."
auto_fix_applied: true
resolution: "The frontmatter records source refs, manifest provenance, import decision, and related on_hold paths."

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 1
next_action: ship
