# Cutover plan (non-executing)

platform: `greenfield_next_app_web`
production_authorized: `false`
executed: `false`
live_wp_parity_claimed: `false`

| Gate | State |
|---|---|
| `parity_evidence_packet_complete` | `met` |
| `quality_preview_bar_green` | `met` |
| `backup_verified` | `met` — [`docs/ops/backup-restore-drill.md`](../../../../ops/backup-restore-drill.md); operator sign-off via plan *Clear production blockers (Stripe deferred)* |
| `named_rollback_plan` | `met` — [`docs/ops/named-rollback-plan.md`](../../../../ops/named-rollback-plan.md) |
| `owner_go_decision` | `unmet` |
| `separate_deployment_instruction` | `unmet` |

Unmet gates (block owner go / production promote):
- `owner_go_decision`
- `separate_deployment_instruction`

Note: Stripe paid/webhook path is **deferred** until Stripe registration (Wave 4 item 6). Non-payment checkout remains proven (item 5).

- This plan is evidence for owner review only.
- It does not authorize DNS, deploy, traffic switch, or WordPress retirement.
- TASK-CUTOVER-001 and TASK-CUTOVER-002 remain on_hold.

