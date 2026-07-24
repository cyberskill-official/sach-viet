# Observability injection

Structured console events:
- `b2c_cutover_plan_started`
- `b2c_cutover_plan_completed`
- `b2c_cutover_plan_failed`
- `b2c_parity_cutover_core_verified` (verifier)

Fields stay outcome-oriented: `outcome`, `row_count`, `unmet_gates`, `executed`, `live_wp_parity_claimed`. No secrets, no DNS/deploy payloads.
