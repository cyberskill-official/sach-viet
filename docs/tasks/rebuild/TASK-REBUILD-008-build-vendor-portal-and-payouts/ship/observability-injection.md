# Observability injection

Emit structured `console.info` JSON events with `task_id: TASK-REBUILD-008` for payout creation (`vendor_payout_created`) and the verify script (`vendor_commerce_core_verified`). Events carry result, payout id, vendor id, and item count only — never session tokens, emails, request bodies, or payment secrets.
