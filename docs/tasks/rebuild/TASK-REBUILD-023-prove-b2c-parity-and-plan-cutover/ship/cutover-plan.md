# Cutover plan (non-executing for WordPress; Production authorized)

platform: `greenfield_next_app_web`
production_authorized: `true`
production_authorization: [`docs/ops/production-go-2026-07-26.md`](../../../../ops/production-go-2026-07-26.md)
executed: `false`
live_wp_parity_claimed: `false`
wordpress_dns_authorized: `false`

| Gate | State |
|---|---|
| `parity_evidence_packet_complete` | `met` |
| `quality_preview_bar_green` | `met` |
| `backup_verified` | `met` — [`docs/ops/backup-restore-drill.md`](../../../../ops/backup-restore-drill.md); operator sign-off via plan *Clear production blockers (Stripe deferred)* |
| `named_rollback_plan` | `met` — [`docs/ops/named-rollback-plan.md`](../../../../ops/named-rollback-plan.md) |
| `owner_go_decision` | `met` — operator 2026-07-26: *go straight to production* ([`production-go-2026-07-26.md`](../../../../ops/production-go-2026-07-26.md)) |
| `separate_deployment_instruction` | `met` — Vercel Production + Supabase, Stripe deferred, no Preview, no WP DNS ([same](../../../../ops/production-go-2026-07-26.md)) |

Unmet / out of scope for this authorization:
- Live WordPress DNS cutover, traffic switch, or WP retirement (`TASK-CUTOVER-001` / `TASK-CUTOVER-002` remain `on_hold`).
- Stripe paid/webhook path stays **deferred** until Stripe registration (Wave 4 item 6). Non-payment checkout remains proven (item 5).

- Greenfield Vercel Production deploy is authorized; mark `executed: true` only after a Production URL health smoke is recorded.
- This plan does **not** authorize DNS changes against WordPress or invent live WP parity.
