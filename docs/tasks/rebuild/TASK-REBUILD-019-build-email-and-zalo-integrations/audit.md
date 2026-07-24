---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-019-build-email-and-zalo-integrations/spec.md"
audited_file_sha256: "17dc2c838e38e56d3bd98c2504500bf746f34e43f9ec05deb1b29532021cb0f5"
audited_body_sha256: "1c3219ac978ec7fe3ca3665aa737391526938c7cb65e8b063663516c65734e8f"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T13:30:00Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-019"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-019 audit

Verdict: pass. The task rebuilds documented email and Zalo external channels as adapter interfaces with credential-free recording stubs by default, optional env-gated SMTP and Zalo OA seams, preference/channel gates, and secret-safe delivery attempts, without locking a paid email SaaS or reopening on-hold legacy email/integration tasks. <!-- authority: human-confirmed -->

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
evidence: "External channels and admin integration status touch credentials and recipient identity."
description: "Secrets and raw recipient identifiers must not leak into events, delivery rows, or admin status."
suggestion: "Require secret omission, redacted correlation ids, and non-secret admin status flags only."
auto_fix_applied: true
resolution: "The proposed solution and guardrail metric forbid secrets in rows/events and limit admin status to mode/presence flags."

ISSUE
id: ISS-003
rule_id: COND-004
status: fixed
severity: warning
evidence: "SMTP credentials and Zalo OA are owner blockers; CI must stay credential-free."
description: "Live transports need a closed default when credentials are absent."
suggestion: "Default to recording stubs; enable SMTP/Zalo OA only through env-gated seams."
auto_fix_applied: true
resolution: "The proposed solution and success metric require stub defaults and optional env-gated seams."

ISSUE
id: ISS-004
rule_id: QA-004
status: fixed
severity: warning
evidence: "Paid email SaaS choice is irreversible and underspecified in sources."
description: "The task must not invent Resend/SendGrid/Mailgun lock-in as the platform default."
suggestion: "Use vendor-agnostic SMTP adapter seams and reject SaaS lock-in in alternatives/out-of-scope."
auto_fix_applied: true
resolution: "Alternatives and out-of-scope explicitly reject paid email SaaS platform defaults."

ISSUE
id: ISS-005
rule_id: QA-006
status: fixed
severity: warning
evidence: "Task 10/11 in-app + SSE and on-hold email/integration tasks must remain intact."
description: "External channels must not rewrite notification cores or reopen legacy on_hold work."
suggestion: "Limit mutation to minimal create-hook/channel extensions; leave TASK-EMAIL-001 and TASK-INTEGRATIONS-001 alone."
auto_fix_applied: true
resolution: "Scope and guardrail require leaving Task 10/11 semantics, on_hold legacy tasks, publisher/author, and royalty gate intact."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The approved rebuild manifest reserves Task 19 for email and Zalo integrations."
description: "The task must retain source and manifest provenance."
suggestion: "Preserve source references, greenfield decision, and related on_hold pointers."
auto_fix_applied: true
resolution: "The frontmatter records source refs, manifest provenance, channel decision, and related on_hold paths."

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 1
next_action: ship
