---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-022-establish-quality-and-preview-release/spec.md"
audited_file_sha256: "1ce53d5f0e3e6d381818c76f790ae6e3b7f10921e1f23a16de3c3e8831e56b0a"
audited_body_sha256: "23f1e5d8fdd5229535614f92d03fc310600fac28dcc0384164c6913d932d39e1"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T13:44:00Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-022"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-022 audit

Verdict: pass. The task establishes a greenfield quality-gate and preview-release process for `app/web` with offline CapRover packaging validation, credential-absent `prepared_local` success, and closed refusal of production deploy or unauthorized push — without requiring live hosting credentials or mutating prior rebuild cores. <!-- authority: human-confirmed -->

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
evidence: "Preview release touches CapRover packaging and may mention credentials."
description: "Secrets and CapRover/GitHub tokens must never be committed or invented."
suggestion: "Forbid writing credentials; require credential-absent local success path."
auto_fix_applied: true
resolution: "Proposed solution and guardrail forbid inventing/storing tokens and require prepared_local without live credentials."

ISSUE
id: ISS-003
rule_id: COND-004
status: fixed
severity: warning
evidence: "CapRover credentials may be absent; standing orders forbid deploy."
description: "The process must have a closed default that completes without live CapRover access."
suggestion: "Require offline prepare/dry-run with prepared_local when credentials are missing."
auto_fix_applied: true
resolution: "Proposed solution and success metric require offline validation and prepared_local on credential absence."

ISSUE
id: ISS-004
rule_id: QA-004
status: fixed
severity: warning
evidence: "Handoff deploy.sh and live preview URLs could invite remote publish."
description: "The task must not ship a default-path production deploy or unauthorized remote publish."
suggestion: "Refuse production/unauthorized remote paths; reject inherited deploy.sh revival."
auto_fix_applied: true
resolution: "Alternatives and out-of-scope reject live deploy requirements and inherited deploy.sh; default path refuses production."

ISSUE
id: ISS-005
rule_id: QA-006
status: fixed
severity: warning
evidence: "Tasks 1–21 and wordpress-import must remain intact; non-rebuild on_hold stays alone."
description: "Quality/preview process must not rewrite prior product cores or reopen on_hold work."
suggestion: "Limit mutation to process module, OPERATIONS, and verify wiring."
auto_fix_applied: true
resolution: "Scope and guardrail limit mutation to process artefacts and minimal verify/OPERATIONS wiring."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The approved rebuild manifest reserves Task 22 for quality and preview release."
description: "The task must retain source and manifest provenance plus credential/standing-order policy."
suggestion: "Preserve source refs, manifest provenance, credential policy, and standing-order notes."
auto_fix_applied: true
resolution: "Frontmatter records source refs, manifest provenance, credential policy, and standing orders."

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 1
next_action: ship
