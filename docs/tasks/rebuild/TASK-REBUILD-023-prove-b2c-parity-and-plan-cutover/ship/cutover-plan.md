# Cutover plan (non-executing)

platform: `greenfield_next_app_web`
production_authorized: `false`
executed: `false`
live_wp_parity_claimed: `false`

| Gate | State |
|---|---|
| `parity_evidence_packet_complete` | `met` |
| `quality_preview_bar_green` | `met` |
| `backup_verified` | `unmet` — evidence path: [`docs/ops/backup-restore-drill.md`](../../../../ops/backup-restore-drill.md); Docker gate: [`docs/docker-acceptance-gate.md`](../../../../docker-acceptance-gate.md) |
| `named_rollback_plan` | `unmet` |
| `owner_go_decision` | `unmet` |
| `separate_deployment_instruction` | `unmet` |

Unmet gates (block owner go):
- `backup_verified`
- `named_rollback_plan`
- `owner_go_decision`
- `separate_deployment_instruction`

- This plan is evidence for owner review only.
- It does not authorize DNS, deploy, traffic switch, or WordPress retirement.
- TASK-CUTOVER-001 and TASK-CUTOVER-002 remain on_hold.

