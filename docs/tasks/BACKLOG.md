# sachviet task backlog

Source of truth for task state = each task's frontmatter `status`. This file indexes them. ONE backlog for ALL work: net-new features (`class: product`, the default) and hardening/refactor/audit-remediation (`class: improvement`) live here together — improvement is not a separate track and never gets a second backlog file. Tag improvement rows with `(improvement)`; untagged rows are product.

Task files live under `docs/tasks/`: flat (`TASK-001-slug.md`) for small repos, or grouped in subfolders by module for larger ones. `improvement/` is a normal subfolder there for cross-cutting hardening tasks.

The `ship-tasks` workflow reads this file, picks the first eligible task (`ready_to_implement` with all `depends_on` done), and drives it through the lifecycle. HITL is required: the agent halts at review acceptance and final acceptance for a recorded human verdict, and never sets `done` itself.

Lifecycle: draft -> ready_to_implement -> implementing -> ready_to_review -> reviewing -> ready_to_test -> testing -> done. Off-ramps: on_hold, closed. See `.cyberos/cuo/STATUS-REFERENCE.md`.

## ready_to_implement

- (none yet - add rows as `- [ready_to_implement] TASK-001-slug - title`; append `(improvement)` for hardening tasks)
- [ready_to_implement] TASK-ADMIN-001-consolidate-dashboard-stats - Consolidate duplicate dashboard statistics endpoints (improvement)
- [ready_to_implement] TASK-AUTH-001-align-role-guards - Align frontend and API role guards (improvement)
- [ready_to_implement] TASK-AUTHOR-001-build-lifecycle-and-earnings - Add author manuscript lifecycle stages and earnings views
- [ready_to_implement] TASK-B2B-001-add-quote-click-through - Add B2B quote-kanban click-through
- [ready_to_implement] TASK-B2B-002-convert-quotes-to-orders - Convert approved B2B quotes into orders
- [ready_to_implement] TASK-B2B-003-manage-contracts-and-pos - Manage B2B contracts and purchase-order artifacts
- [ready_to_implement] TASK-CUTOVER-001-define-b2c-parity - Define and verify B2C parity before cutover (improvement)
- [ready_to_implement] TASK-DISCOVERY-001-reconcile-handoff-sources - Reconcile the handoff with the application and live TODO (improvement)
- [ready_to_implement] TASK-EMAIL-001-enable-transactional-email - Enable transactional email flows
- [ready_to_implement] TASK-EMPLOYEE-001-wire-home-config-editor - Connect the employee home-config editor to its backend
- [ready_to_implement] TASK-EMPLOYEE-002-add-real-dashboard-kpis - Replace mocked employee dashboard KPIs with real data
- [ready_to_implement] TASK-I18N-001-localize-datatable-pagination - Localize DataTable pagination for vi and en (improvement)
- [ready_to_implement] TASK-INSTITUTION-001-add-budget-tracking-and-pos - Add institutional budget tracking and PO submission
- [ready_to_implement] TASK-INSTITUTION-002-deliver-purchased-marc-records - Deliver MARC records for purchased titles
- [ready_to_implement] TASK-INTEGRATIONS-001-complete-admin-integrations - Complete Zalo and email settings screens
- [ready_to_implement] TASK-MIGRATION-001-reconcile-wp-order-items - Reconcile unmatched WordPress order items (improvement)
- [ready_to_implement] TASK-NOTIFICATIONS-001-verify-notification-bell - Verify notification badge and deeplink behavior (improvement)
- [ready_to_implement] TASK-NOTIFICATIONS-002-add-live-notifications - Add live notification delivery
- [ready_to_implement] TASK-PUBLISHER-001-build-financial-dashboard - Add publisher sales rollups, royalties, and contract management
- [ready_to_implement] TASK-QUALITY-001-test-checkout-payments - Add checkout and hosted-payment regression coverage (improvement)
- [ready_to_implement] TASK-QUALITY-002-test-vendor-payouts - Add vendor payout regression coverage (improvement)
- [ready_to_implement] TASK-QUALITY-003-test-b2b-pipeline - Add B2B quote-pipeline regression coverage (improvement)
- [ready_to_implement] TASK-RETAIL-001-add-order-processing-actions - Add retail order-processing actions
- [ready_to_implement] TASK-RETAIL-002-add-returns-workflow - Add the returns workflow
- [ready_to_implement] TASK-ROYALTY-001-model-royalties-and-earnings - Model royalties and earnings
- [ready_to_implement] TASK-SEARCH-001-add-vietnamese-fuzzy-search - Add Vietnamese fuzzy search with Meilisearch
- [ready_to_implement] TASK-SECURITY-001-retire-maintenance-endpoints - Retire exposed maintenance debug endpoints (improvement)
- [ready_to_implement] TASK-SUPPLIER-001-resolve-portal-scope - Resolve and implement the supplier portal scope
- [ready_to_implement] TASK-VENDOR-001-verify-vendor-fulfillment - Verify vendor fulfillment and tracking behavior (improvement)
- [ready_to_implement] TASK-VENDOR-002-add-dashboard-analytics - Add vendor dashboard analytics with real API data
- [ready_to_implement] TASK-VENDOR-003-add-report-export - Add vendor report export

## in flight

- (implementing / reviewing / testing tasks appear here)

## done

- (shipped tasks, for the audit trail)

## on_hold / closed

- (deferred or killed tasks)
- [on_hold] TASK-CUTOVER-002-execute-wordpress-cutover - Execute the approved WordPress cutover
