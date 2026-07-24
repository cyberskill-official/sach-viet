---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-015-build-institution-buyer-portal/spec.md"
audited_file_sha256: "c2214f7782cfeaac394f763a787fbadc8f88d12ccf86a70bcd115f4fa5acd1c3"
audited_body_sha256: "d315559e8b353191702229ae7e15dd7ec1cfe78e644c9e9d16ec6a5e8bb55349"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T13:10:00Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-015"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-015 audit

Verdict: pass. The task rebuilds the documented institution buyer portal needs — informational organization budget, institution-initiated PO submission on awaiting_po orders, and entitlement-gated private MARC delivery for confirmed purchased titles — on top of Tasks 4, 13, and 14 while leaving quote/order cores and institution blind reads intact, preserving blind brokerage, and excluding financial ledgers, auto-confirmation, MARC serializers, public hosting, and legacy recovery under the greenfield-only decision. <!-- authority: human-confirmed -->

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
evidence: "Budgets, PO submission, and MARC delivery span institution buyers and B2B staff."
description: "Mutations must not rely on client authorization."
suggestion: "Require signed-session role checks for school_librarian/admin institution surfaces and employee_b2b/admin MARC registration."
auto_fix_applied: true
resolution: "The proposed solution and success metric require signed-session role gates and organization isolation."

ISSUE
id: ISS-003
rule_id: COND-004
status: fixed
severity: warning
evidence: "PO submission and MARC entitlement depend on B2B order lifecycle states."
description: "Submission and entitlement preconditions need a closed boundary."
suggestion: "Allow PO submission only against organization-owned awaiting_po orders; gate MARC on confirmed organization order line products."
auto_fix_applied: true
resolution: "The proposed solution enumerates awaiting_po submission and confirmed-order MARC entitlement."

ISSUE
id: ISS-004
rule_id: QA-004
status: fixed
severity: warning
evidence: "Quote/order cores and institution blind reads already ship; financial ledgers and MARC serializers are undecided."
description: "The task must not rewrite quote/order cores or invent financial/MARC serialization systems."
suggestion: "Build on top of intact cores; exclude ledgers, auto-confirm, serializers, public URLs, and legacy recovery."
auto_fix_applied: true
resolution: "Alternatives and out-of-scope clauses reject those surfaces; Tasks 13 and 14 remain owners of quote/order domains."

ISSUE
id: ISS-005
rule_id: QA-006
status: fixed
severity: warning
evidence: "Blind brokerage forbids supplier disclosure; storage keys and payment secrets can leak."
description: "Institution budget/PO/MARC views and events can expose vendors, storage keys, emails, or payment secrets."
suggestion: "Omit vendor/supplier identifiers from institution responses; omit session tokens, emails, request bodies, payment secrets, and non-entitled storage keys from responses and events."
auto_fix_applied: true
resolution: "The guardrail metric and blindness clauses require those omissions."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The approved rebuild manifest reserves Task 15 for the institution buyer portal on Tasks 4, 13, and 14."
description: "The task must retain source and manifest provenance and must not overload B2C Stripe orders or rewrite prior cores."
suggestion: "Preserve source references, greenfield decision, and composition over rewrite."
auto_fix_applied: true
resolution: "The frontmatter records provenance; proposed solution and out-of-scope preserve prior module ownership."

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 1
next_action: ship
