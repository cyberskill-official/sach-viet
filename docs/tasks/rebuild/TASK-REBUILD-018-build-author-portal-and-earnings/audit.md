---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-018-build-author-portal-and-earnings/spec.md"
audited_file_sha256: "d7ae0311c5e00686e6c21762e01dadeaa8f5798b79d72947538afa249dbc2306"
audited_body_sha256: "29727a6c7d5bd6a810ea0b655107e78f0007adefcb7cad158524fa3521883ee5"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T13:25:00Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-018"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-018 audit

Verdict: pass. The task builds greenfield author portal scaffolding under the TASK-REBUILD-016 owner-acceptance activation gate — non-financial manuscript requests with submitted/withdrawn log evidence plus an explicit policy-pending dashboard for earnings and expanded stages — without inventing rates, splits, settlement math, payouts, review-stage machines, or live financial values, and without mutating `TASK-AUTHOR-001` / `TASK-ROYALTY-001` / Task 17 publisher scaffolding. <!-- authority: human-confirmed -->

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
description: "Author earnings must remain blocked while decision-register acceptance is absent."
suggestion: "Require an executable refuse path and policy-pending dashboard markers while the gate is open."
auto_fix_applied: true
resolution: "Proposed solution and guardrail metric encode the activation gate and policy-pending markers for earnings and expanded stages."

ISSUE
id: ISS-004
rule_id: SEC-005
status: fixed
severity: warning
evidence: "Author portal spans author and admin actors with private storage keys."
description: "Mutations and reads must not rely on client authorization and must not leak secrets."
suggestion: "Require signed-session role checks and omit session tokens, emails, request bodies, payment secrets, and storage keys from responses/events."
auto_fix_applied: true
resolution: "Proposed solution and guardrail require signed-session gates and secret omissions."

ISSUE
id: ISS-005
rule_id: QA-004
status: fixed
severity: warning
evidence: "TASK-AUTHOR-001 and TASK-ROYALTY-001 are done handoff artefacts; Task 17 publisher scaffolding is done; vendor payouts already ship."
description: "Greenfield scope must not mutate non-rebuild author/royalty work or rewrite publisher/vendor ownership."
suggestion: "Leave those artefacts intact; reuse activation-gate semantics without weakening publisher refuse paths."
auto_fix_applied: true
resolution: "Provenance, alternatives, and out-of-scope preserve those surfaces."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "Sources name manuscript pipeline stages and earnings once a royalty model exists."
description: "Expanded review stages and earnings math must not be invented to satisfy the portal need."
suggestion: "Limit lifecycle evidence to submitted/withdrawn plus append-only status logs; mark expanded stages and earnings policy-pending."
auto_fix_applied: true
resolution: "Proposed solution forbids invented stage machines and keeps expanded stages/earnings as policy-pending placeholders."

## §3 — Resolution

All 6 mechanical concerns addressed. **Score = 10/10.**

---

*End of TASK-REBUILD-018 audit.*
