---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-009-build-employee-and-retail-operations/spec.md"
audited_file_sha256: "98ebdae4fce2d19308c4a125982f2355ec123133b607a010eb93724a47f65818"
audited_body_sha256: "c20326a701b25dd166f9576bc6273d7b2c0e13b6cff42cc9451f75d4a92780f9"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T12:38:29Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-009"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-009 audit

Verdict: pass. The task uses the documented employee hub, home-config gap, and retail order-queue needs while preserving the greenfield-only exclusion of fulfillment, returns, refunds, and B2B quote work. <!-- authority: human-confirmed -->

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
evidence: "The source restricts employee and retail portals to documented staff roles."
description: "Employee dashboard, home-config, and retail order reads must not rely on client authorization."
suggestion: "Require signed-session employee or retail role checks in the server repository and routes."
auto_fix_applied: true
resolution: "The proposed solution requires signed-session authorization and documented role bundles."

ISSUE
id: ISS-003
rule_id: COND-004
status: fixed
severity: warning
evidence: "The source lists home-config as unwired and employee KPIs as partially mocked."
description: "Dashboard totals and home-config writes need concrete, existing-record boundaries."
suggestion: "Derive counts from existing order, support, goods-request, and pending vendor-application rows and persist only home_sections."
auto_fix_applied: true
resolution: "Both the proposed solution and in-scope clauses name those exact surfaces."

ISSUE
id: ISS-004
rule_id: QA-004
status: fixed
severity: warning
evidence: "The source supplies no greenfield fulfillment, returns, or refund contract."
description: "The task must not invent order-processing state machines or financial staff actions."
suggestion: "Keep retail orders read-only and exclude fulfillment, refund, and returns behavior."
auto_fix_applied: true
resolution: "Alternatives and out-of-scope clauses reject those undefined operations."

ISSUE
id: ISS-005
rule_id: QA-006
status: fixed
severity: warning
evidence: "Customer email and payment secrets must not appear in staff list views."
description: "Employee and retail responses can leak customer secrets if list projections are unbounded."
suggestion: "Omit customer email, session tokens, and payment secrets from responses and events."
auto_fix_applied: true
resolution: "The guardrail metric and event clause require those omissions."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The approved rebuild manifest reserves Task 9 for employee and retail operations."
description: "The task must retain source and manifest provenance."
suggestion: "Preserve source references and the approved greenfield decision."
auto_fix_applied: true
resolution: "The frontmatter records both provenance paths."

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 1
next_action: ship
