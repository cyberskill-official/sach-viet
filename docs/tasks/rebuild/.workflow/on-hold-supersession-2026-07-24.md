# On-hold supersession — close clearly covered duplicates

**Date:** 2026-07-24  
**Actor:** operator (session judgment via “do as your judgment”)  
**Decision:** Q3 on_hold = B Close clearly superseded duplicates  
**Status used:** `closed` (not `done`) — terminal kill as superseded by greenfield REBUILD work.

## Closed as superseded

| Closed task | Covered by | Why this is honest |
|---|---|---|
| TASK-EMAIL-001 | TASK-REBUILD-019 | Email/Zalo adapters + recording stubs + admin non-secret status; not live SMTP prod (same non-prod constraint as EMAIL-001 intent under greenfield). |
| TASK-NOTIFICATIONS-002 | TASK-REBUILD-011 | Live in-app delivery via authenticated SSE shipped; supersedes legacy “live delivery” intent. |
| TASK-SEARCH-001 | TASK-REBUILD-020 | Local Vietnamese-aware catalog search shipped; Meilisearch remains optional and is not required. |
| TASK-INSTITUTION-001 | TASK-REBUILD-015 | Informational budget + institution PO submission against org-owned orders. |
| TASK-INSTITUTION-002 | TASK-REBUILD-015 | Entitlement-gated private MARC metadata delivery for purchased titles. |
| TASK-B2B-001 | TASK-REBUILD-013 | Staff quote pipeline includes quote detail click-through. |
| TASK-B2B-003 | TASK-REBUILD-014 | Private contract / purchase-order artifact association on B2B orders. |
| TASK-EMPLOYEE-002 | TASK-REBUILD-009 | Employee dashboard KPIs are real counts from existing records (not mocks). |

## Left on_hold (not closed)

| Task | Reason kept |
|---|---|
| TASK-INTEGRATIONS-001 | REBUILD-019 covers admin adapter status only; full Zalo/email settings screens remain incomplete. |
| TASK-ADMIN-001 | Greenfield admin commerce is a single dashboard; this improvement was legacy duplicate-endpoint consolidation and is not clearly delivered as that cleanup. |
| TASK-CUTOVER-001, TASK-CUTOVER-002 | Production cutover deferred; planning-only (see REBUILD-023 owner note). |
| TASK-MIGRATION-001 | WP order-item reconciliation still open. |
| TASK-SUPPLIER-001 | Supplier portal scope not implemented as a product portal. |
| TASK-PUBLISHER-001 | Financial dashboard still gated on royalty acceptance. |
| TASK-RETAIL-001, TASK-RETAIL-002 | Order-processing actions / returns not shipped as those scopes. |
| TASK-SECURITY-001 | Maintenance-endpoint retirement not delivered. |
| TASK-VENDOR-001, TASK-VENDOR-002, TASK-VENDOR-003 | Fulfillment verify / analytics / export not clearly fully covered. |
| TASK-I18N-001 | DataTable pagination localization not delivered. |

## Royalty / cutover reminder

Session HITL waiver does **not** invent financial rates or authorize production cutover. See:

- `docs/tasks/rebuild/TASK-REBUILD-016-define-royalty-and-earnings-policy/ship/owner-deferral-2026-07-24.md`
- `docs/tasks/rebuild/TASK-REBUILD-023-prove-b2c-parity-and-plan-cutover/ship/owner-planning-only-2026-07-24.md`
