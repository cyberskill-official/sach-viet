---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-017-build-publisher-portal-and-royalties/spec.md"
audited_file_sha256: "d8cf04f4aa2d4460c32760033a836a31d2cb645b59c57300e968398e05a4f11f"
audited_body_sha256: "4e5334d4830312d00642efe27a68ca8d56503b71a9970214d43ced65f7548e48"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T13:20:00Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-017"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-017 audit

Verdict: pass. The task builds greenfield publisher portal scaffolding under the TASK-REBUILD-016 owner-acceptance activation gate — non-financial publishing requests and MARC metadata plus an explicit policy-pending dashboard — without inventing rates, splits, settlement math, payouts, or live financial values, and without mutating `TASK-PUBLISHER-001` / `TASK-ROYALTY-001`. <!-- authority: human-confirmed -->

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
evidence: "Task 16 decision-register rows are unresolved; royalty model is an owner product decision."
description: "The task must not invent royalty rates, splits, allocation, tax, payouts, or dashboard financial amounts."
suggestion: "Limit financial surfaces to policy-pending placeholders and an executable activation-gate refuse path."
auto_fix_applied: true
resolution: "Proposed solution, success metrics, and out-of-scope forbid invented financial rules and require gate refusal."

ISSUE
id: ISS-003
rule_id: COND-004
status: fixed
severity: warning
evidence: "TASK-REBUILD-016 activation gate blocks Tasks 17/18 financial activation until owner acceptance."
description: "Publisher royalties must remain blocked while decision-register acceptance is absent."
suggestion: "Require an executable refuse path and policy-pending dashboard markers while the gate is open."
auto_fix_applied: true
resolution: "Proposed solution and guardrail metric encode the activation gate and policy-pending markers."

ISSUE
id: ISS-004
rule_id: SEC-005
status: fixed
severity: warning
evidence: "Publisher portal spans publisher and admin actors with private storage keys."
description: "Mutations and reads must not rely on client authorization and must not leak secrets."
suggestion: "Require signed-session role checks and omit session tokens, emails, request bodies, payment secrets, and storage keys from responses/events."
auto_fix_applied: true
resolution: "Proposed solution and guardrail require signed-session gates and secret omissions."

ISSUE
id: ISS-005
rule_id: QA-004
status: fixed
severity: warning
evidence: "TASK-PUBLISHER-001 is on_hold; TASK-ROYALTY-001 and docs/royalty/* are done handoff artefacts; vendor payouts and institution MARC already ship."
description: "Greenfield scope must not mutate non-rebuild publisher/royalty work or rewrite vendor/institution ownership."
suggestion: "Leave those artefacts intact; keep institution MARC and vendor payout cores untouched."
auto_fix_applied: true
resolution: "Provenance, alternatives, and out-of-scope preserve those surfaces."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "Depends on catalog products (Task 4) and the royalty policy gate (Task 16); author earnings belong to Task 18."
description: "Dependencies and deferred author/financial activation must stay explicit."
suggestion: "Cite Tasks 4 and 16; exclude author earnings and financial activation without accepted register rows."
auto_fix_applied: true
resolution: "Dependencies and out-of-scope name Tasks 4/16/18 boundaries and the activation gate."

## §3 — Resolution

All 6 mechanical concerns addressed. **Score = 10/10.**

---

*End of TASK-REBUILD-017 audit.*
