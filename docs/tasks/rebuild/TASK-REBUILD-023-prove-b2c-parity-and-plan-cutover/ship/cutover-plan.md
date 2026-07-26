# Cutover plan (non-executing for WordPress; Production authorized)

platform: `greenfield_next_app_web`
production_authorized: `true`
production_authorization: [`docs/ops/production-go-2026-07-26.md`](../../../../ops/production-go-2026-07-26.md)
executed: `true`
executed_at: `2026-07-26T08:09:00Z`
production_url: `https://sachviet.cyberskill.world`
health_smoke: `GET /api/health → {"ok":true,"db":"ok"}` (smoke:production health-postgres PASS)
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

Out of scope / held (no WP in this go):
- WordPress is **not** in play — no WP import, DNS, traffic switch, or retirement. `TASK-CUTOVER-001` / `TASK-CUTOVER-002` / `TASK-MIGRATION-001` stay `on_hold` / unused.
- Stripe paid/webhook path stays **deferred** until an explicit Stripe registration instruction (Wave 4 item 6). Non-payment checkout remains the commerce proof.
- Phase B/C product tasks remain `on_hold` until a new explicit operator instruction.

Day-2 catalog (not blocking `executed`):
- **done** (2026-07-27) via admin catalog APIs (`TASK-ADMIN-002`) — public catalog non-empty; Production smoke 4/4. Still **never** `seed:local` against Supabase Production. No WordPress fixture/import path.
