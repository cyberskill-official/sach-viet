---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-023-prove-b2c-parity-and-plan-cutover/spec.md"
audited_file_sha256: "c6cde8f936ca6aae575dfa38ef4c0f87e0a4b327f9d7e8b38116348126efd8de"
audited_body_sha256: "87a9080453782f2e8eceaf9748a8f91344c56526ca06fa886191984329d799b3"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T13:48:30Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-023"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-023 audit

Verdict: pass. The task establishes greenfield B2C capability evidence (closed checklist + matrix with closed-set statuses) and a non-executing cutover plan for Next.js `app/web`, with automated checks that forbid live WordPress parity claims and refuse production actions — without reopening on-hold cutover/migration work or mutating prior rebuild cores. <!-- authority: human-confirmed -->

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
evidence: "Cutover planning may mention CapRover, DNS, or hosting credentials."
description: "Secrets and hosting tokens must never be committed or invented."
suggestion: "Forbid inventing credentials; keep plan gates credential-free for CI."
auto_fix_applied: true
resolution: "Alternatives, out-of-scope, and guardrail forbid CapRover/GitHub credential invention and live hosting dependence."

ISSUE
id: ISS-003
rule_id: COND-004
status: fixed
severity: warning
evidence: "Live WordPress comparison data is unavailable under greenfield-only."
description: "Parity evidence must have a closed default that does not require live legacy access."
suggestion: "Require fixture/API greenfield evidence and evidence_unavailable for missing live comparison."
auto_fix_applied: true
resolution: "Proposed solution and parity_claim_policy require greenfield_proven vs evidence_unavailable and forbid live_wp_parity claims."

ISSUE
id: ISS-004
rule_id: QA-004
status: fixed
severity: warning
evidence: "Vision short-term includes sachviet.us cutover and WordPress retirement."
description: "The task must not ship or authorize production cutover, DNS, or WP retirement."
suggestion: "Refuse production actions in default path; keep plan non-executing."
auto_fix_applied: true
resolution: "Proposed solution, alternatives, and out-of-scope refuse DNS/deploy/WP retirement and require refused_production on production paths."

ISSUE
id: ISS-005
rule_id: QA-006
status: fixed
severity: warning
evidence: "TASK-CUTOVER-001/002 and TASK-MIGRATION-001 are on_hold; Tasks 1–22 must stay intact."
description: "Evidence/plan work must not reopen on_hold cutover/migration or rewrite prior cores."
suggestion: "Leave on_hold specs alone; limit mutation to parity-cutover core + verify/OPERATIONS wiring."
auto_fix_applied: true
resolution: "Scope and guardrail leave cutover/migration on_hold and limit mutation to new core plus minimal verify/OPERATIONS wiring."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The approved rebuild manifest reserves Task 23 for prove-b2c-parity-and-plan-cutover."
description: "The task must retain source, manifest, greenfield, and on_hold provenance."
suggestion: "Preserve source refs, parity_claim_policy, standing orders, and related on_hold pointers."
auto_fix_applied: true
resolution: "Frontmatter records source refs, manifest provenance, parity_claim_policy, standing orders, and related on_hold paths."

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 1
next_action: ship
