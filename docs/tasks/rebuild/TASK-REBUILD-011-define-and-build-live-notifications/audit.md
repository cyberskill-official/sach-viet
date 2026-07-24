---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-011-define-and-build-live-notifications/spec.md"
audited_file_sha256: "6ed347dd0d6fd27da1c442e9553f40b356fe150fd36d90cb04a65bd0ace815bc"
audited_body_sha256: "d7bb5c9e0733823c30499513b0ea51329f331ca45573652dbcd8dff3cb5c6c48"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T12:50:00Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-011"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-011 audit

Verdict: pass. The task defines authenticated SSE as the greenfield live transport and builds an owner-scoped stream on Task 10's inbox while excluding Pusher, Reverb, email/Zalo, and legacy recovery. <!-- authority: human-confirmed -->

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
evidence: "Live streams can leak cross-user notification events."
description: "Stream open and publish delivery must not rely on client-supplied user ids."
suggestion: "Require signed-session ownership for stream subscription and event fan-out."
auto_fix_applied: true
resolution: "The proposed solution and guardrail metric require signed-session owner-only streaming."

ISSUE
id: ISS-003
rule_id: COND-004
status: fixed
severity: warning
evidence: "The source lists Reverb, Pusher, and polling without a greenfield choice."
description: "The define half of the task must close the transport decision with a concrete boundary."
suggestion: "Choose authenticated SSE for Next.js and reject Reverb, Pusher, and poll-only primary delivery."
auto_fix_applied: true
resolution: "The proposed solution and alternatives record SSE as the chosen transport with explicit rejections."

ISSUE
id: ISS-004
rule_id: QA-004
status: fixed
severity: warning
evidence: "Email/Zalo and paid push providers are separate owner-gated work."
description: "The task must not invent external messaging or paid push dependencies."
suggestion: "Exclude SMTP, Zalo, SMS, Pusher credentials, and Reverb from scope."
auto_fix_applied: true
resolution: "Alternatives and out-of-scope clauses reject those surfaces; Task 19 owns external channels."

ISSUE
id: ISS-005
rule_id: QA-006
status: fixed
severity: warning
evidence: "Live event payloads can leak secrets if unbounded."
description: "Stream frames and structured events can expose session tokens, emails, or payment secrets."
suggestion: "Omit session tokens, email addresses, request bodies, and payment secrets from stream frames and events."
auto_fix_applied: true
resolution: "The guardrail metric and event clause require those omissions."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The approved rebuild manifest reserves Task 11 for live notifications after Task 10."
description: "The task must retain source, dependency, and greenfield provenance."
suggestion: "Preserve Task 10 dependency, source refs, and the greenfield decision."
auto_fix_applied: true
resolution: "The frontmatter records dependency, source refs, and greenfield provenance."

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 1
next_action: ship
