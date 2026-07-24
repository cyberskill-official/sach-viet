---
audit_template_version: "audit_rubric@2.0"
audited_file: "docs/tasks/rebuild/TASK-REBUILD-020-build-vietnamese-search/spec.md"
audited_file_sha256: "d890da3e74821bedcde6866271223602fa60de89e90fe2a5a6dd84d595de1dc5"
audited_body_sha256: "85b9bd116b5353f024e3c90bf07bf0031f5839b813d6958ca80248206d961cc7"
rubric_version: "audit_rubric@2.0"
skill_id: "task-audit"
skill_version: "1.0.0"
last_audit_at: "2026-07-24T13:32:00Z"
overall_status: "pass"
iterations: 1
issue_counts: { total: 6, open: 0, needs_human: 0, fixed: 6, wontfix: 0 }
trace_id: "sachviet-rebuild-020"
caller_persona: "cuo-cpo"
---

# TASK-REBUILD-020 audit

Verdict: pass. The task rebuilds documented Vietnamese fuzzy/diacritic catalog search as a local-default SearchBackend with optional env-gated Meilisearch HTTP seam, suggestions, and search_logs analytics, without locking a paid search SaaS or requiring CapRover Meilisearch for CI, and without reopening on-hold TASK-SEARCH-001. <!-- authority: human-confirmed -->

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
rule_id: COND-004
status: fixed
severity: warning
evidence: "Meilisearch timing/analyzer remains an open discussion; CI must stay service-free."
description: "External search backends need a closed default when Meilisearch is absent."
suggestion: "Default to local Vietnamese-aware backend; enable Meilisearch only through env-gated seams."
auto_fix_applied: true
resolution: "The proposed solution and success metric require local defaults and optional env-gated Meilisearch seams."

ISSUE
id: ISS-003
rule_id: QA-004
status: fixed
severity: warning
evidence: "Paid search SaaS choice is irreversible and underspecified in sources."
description: "The task must not invent Algolia/Typesense Cloud/Elasticsearch Cloud lock-in as the platform default."
suggestion: "Reject paid SaaS lock-in in alternatives/out-of-scope; keep Meilisearch as optional HTTP seam only."
auto_fix_applied: true
resolution: "Alternatives and out-of-scope explicitly reject paid search SaaS platform defaults."

ISSUE
id: ISS-004
rule_id: QA-006
status: fixed
severity: warning
evidence: "Task 4 catalog ownership and on-hold TASK-SEARCH-001 must remain intact."
description: "Search must not rewrite buy-box rules or reopen legacy on_hold work."
suggestion: "Limit mutation to search core + catalog q/suggestions wiring; leave TASK-SEARCH-001 alone."
auto_fix_applied: true
resolution: "Scope and guardrail require leaving Task 4 ownership, on_hold TASK-SEARCH-001, email/Zalo, notification/SSE, and publisher/author intact."

ISSUE
id: ISS-005
rule_id: SEC-005
status: fixed
severity: warning
evidence: "Search logs and public APIs must not index private accounts/orders or leak session secrets."
description: "Index scope must stay public catalog; logs must omit session tokens."
suggestion: "Forbid private-data search; require search_logs without session secrets."
auto_fix_applied: true
resolution: "Out-of-scope forbids private-data search; proposed solution limits logs to public query analytics fields."

ISSUE
id: ISS-006
rule_id: XCHAIN-001
status: fixed
severity: warning
evidence: "The approved rebuild manifest reserves Task 20 for Vietnamese search."
description: "The task must retain source and manifest provenance."
suggestion: "Preserve source references, greenfield decision, search decision, and related on_hold pointers."
auto_fix_applied: true
resolution: "The frontmatter records source refs, manifest provenance, search decision, and related on_hold path."

SUMMARY
verdict: pass
issues_total: 6
issues_open: 0
issues_human: 0
issues_fixed: 6
iterations: 1
next_action: ship
