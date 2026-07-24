---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-016-define-royalty-and-earnings-policy/spec.md"
audited_file_sha256: "4524b7729cec115af46ad9658b986acd0f9c9956045a02fde6c44943779ff959"
audited_body_sha256: "cba62010a929326d2a3c1a9a7184ebc1d5ab765568606b50aa7bdefb3c5ceb25"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T13:15:00Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-016"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-016 audit

Verdict: pass. The task records a greenfield royalty and earnings policy foundation without inventing rates, settlement math, payouts, or financial dashboards, and it leaves non-rebuild royalty and publisher work untouched. <!-- authority: human-confirmed -->

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
rule_id: QA-006
status: fixed
severity: warning
evidence: "Sources name royalty/earnings as an owner product decision and do not define rates or splits."
description: "The task must not invent royalty rates, settlement math, ledgers, or payouts."
suggestion: "Limit delivery to a policy proposal and input inventory with unresolved financial rules."
auto_fix_applied: true
resolution: "Summary, proposed solution, and out-of-scope forbid invented financial rules and settlement automation."

ISSUE
id: ISS-003
rule_id: COND-004
status: fixed
severity: warning
evidence: "Publisher and author portals are mocked and blocked on the royalty model; Tasks 17 and 18 depend on this foundation."
description: "The define task must close the policy-gate choice and block financial activation until owner acceptance."
suggestion: "Require owner acceptance before Tasks 17 and 18 activate financial behavior."
auto_fix_applied: true
resolution: "Proposed solution and success metrics record the owner-acceptance activation gate for Tasks 17 and 18."

ISSUE
id: ISS-004
rule_id: QA-004
status: fixed
severity: warning
evidence: "TASK-ROYALTY-001 is done with docs/royalty artefacts; TASK-PUBLISHER-001 is on_hold."
description: "Greenfield scope must not mutate completed handoff royalty work or un-hold non-rebuild publisher work."
suggestion: "Leave TASK-ROYALTY-001, docs/royalty/*, and TASK-PUBLISHER-001 unchanged."
auto_fix_applied: true
resolution: "Provenance, alternatives, and out-of-scope preserve those non-rebuild artefacts."

ISSUE
id: ISS-005
rule_id: SEC-005
status: fixed
severity: warning
evidence: "Greenfield reserves publisher/author ACL and proxy matchers without royalty APIs."
description: "This task must not invent financial access policy, payout authority, or dashboard financial values."
suggestion: "Inventory reservations vs absences and forbid financial API or access-policy invention."
auto_fix_applied: true
resolution: "Guardrail metric and out-of-scope forbid financial APIs, payouts, and access-policy invention beyond inventory."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The approved rebuild manifest reserves Task 16 for define-royalty-and-earnings-policy with empty depends_on."
description: "The task must retain source, empty dependency, and greenfield provenance."
suggestion: "Preserve source refs, empty depends_on, and related royalty/publisher provenance."
auto_fix_applied: true
resolution: "Frontmatter records empty depends_on, source refs, greenfield provenance, and related royalty/publisher tasks."

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 1
next_action: ship
