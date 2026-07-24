---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-010-build-notification-and-preferences/spec.md"
audited_file_sha256: "d0fa7060630dfd95bc06fcbb3a01b5bcede3b0b807469f0a07619362c6b0f4dc"
audited_body_sha256: "95e91453482ebbedbdfd2cfdccc679f6ebe79dfc537ab4e4dfdb06ac84bc7cef"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T12:45:00Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-010"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-010 audit

Verdict: pass. The task rebuilds the documented in-app notification inbox, badge, deeplink, event-type registry, and preference/channel surfaces while excluding live transport, external messaging, and legacy recovery under the greenfield-only decision. <!-- authority: human-confirmed -->

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
evidence: "Notifications are user-owned and cross-portal."
description: "Inbox reads, mark-read, and preference writes must not rely on client authorization."
suggestion: "Require signed-session ownership checks in the server repository and routes."
auto_fix_applied: true
resolution: "The proposed solution and success metric require signed-session owner-only access."

ISSUE
id: ISS-003
rule_id: COND-004
status: fixed
severity: warning
evidence: "The source names NotificationEventType with 10+ trigger keys and preference/channel records."
description: "The event registry and preference gates need concrete closed boundaries."
suggestion: "Seed at least ten source-grounded event keys and gate in-app creation through preferences and the in_app channel."
auto_fix_applied: true
resolution: "The proposed solution enumerates eleven grounded keys and preference/channel gates."

ISSUE
id: ISS-004
rule_id: QA-004
status: fixed
severity: warning
evidence: "Real-time delivery and email/Zalo are separate roadmap items."
description: "The task must not invent live transport or external messaging."
suggestion: "Exclude WebSocket/SSE/Reverb/Pusher and email/Zalo/SMS send paths."
auto_fix_applied: true
resolution: "Alternatives and out-of-scope clauses reject those surfaces; Task 11 and Task 19 own them."

ISSUE
id: ISS-005
rule_id: QA-006
status: fixed
severity: warning
evidence: "Notification payloads can leak secrets if unbounded."
description: "Inbox responses and events can expose session tokens, emails, or payment secrets."
suggestion: "Omit session tokens, email addresses, request bodies, and payment secrets from responses and events."
auto_fix_applied: true
resolution: "The guardrail metric and event clause require those omissions."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The approved rebuild manifest reserves Task 10 for notification and preferences."
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
