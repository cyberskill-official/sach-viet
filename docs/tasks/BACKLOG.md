# sachviet task backlog

Source of truth for task state = each task's frontmatter `status`. This file indexes them. ONE backlog for ALL work: net-new features (`class: product`, the default) and hardening/refactor/audit-remediation (`class: improvement`) live here together — improvement is not a separate track and never gets a second backlog file. Tag improvement rows with `(improvement)`; untagged rows are product.

Task files live under `docs/tasks/`: flat (`TASK-001-slug.md`) for small repos, or grouped in subfolders by module for larger ones. `improvement/` is a normal subfolder there for cross-cutting hardening tasks.

The `ship-tasks` workflow reads this file, picks the first eligible task (`ready_to_implement` with all `depends_on` done), and drives it through the lifecycle. HITL is required: the agent halts at review acceptance and final acceptance for a recorded human verdict, and never sets `done` itself.

Lifecycle: draft -> ready_to_implement -> implementing -> ready_to_review -> reviewing -> ready_to_test -> testing -> done. Off-ramps: on_hold, closed. See `.cyberos/cuo/STATUS-REFERENCE.md`.

## ready_to_implement

- (none yet - add rows as `- [ready_to_implement] TASK-001-slug - title`; append `(improvement)` for hardening tasks)
- [on_hold] TASK-ADMIN-001-consolidate-dashboard-stats - Consolidate duplicate dashboard statistics endpoints (improvement)
- [done] TASK-ADMIN-002-admin-catalog-writes - Add admin catalog write APIs and thin dashboard UI
- [done] TASK-AUTH-001-align-role-guards - Align frontend and API role guards (improvement)
- [done] TASK-AUTHOR-001-build-lifecycle-and-earnings - Add author manuscript lifecycle stages and earnings views
- [done] TASK-B2B-002-convert-quotes-to-orders - Convert approved B2B quotes into orders
- [on_hold] TASK-CUTOVER-001-define-b2c-parity - Define and verify B2C parity before cutover (improvement)
- [done] TASK-DISCOVERY-001-reconcile-handoff-sources - Reconcile the handoff with the application and live TODO (improvement)
- [done] TASK-EMPLOYEE-001-wire-home-config-editor - Connect the employee home-config editor to its backend
- [on_hold] TASK-I18N-001-localize-datatable-pagination - Localize DataTable pagination for vi and en (improvement)
- [on_hold] TASK-INTEGRATIONS-001-complete-admin-integrations - Complete Zalo and email settings screens
- [on_hold] TASK-MIGRATION-001-reconcile-wp-order-items - Reconcile unmatched WordPress order items (improvement)
- [done] TASK-NOTIFICATIONS-001-verify-notification-bell - Verify notification badge and deeplink behavior (improvement)
- [done] TASK-PORTALUI-001-adopt-cyberskill-design-thuy - Adopt CyberSkill Design with the Thủy identity
- [done] TASK-PORTALUI-002-build-customer-storefront - Build the customer storefront experience
- [done] TASK-PORTALUI-003-build-admin-commerce-portal - Build the admin commerce portal
- [done] TASK-PORTALUI-004-complete-shared-portal-chrome - Complete shared role-aware portal chrome
- [on_hold] TASK-PUBLISHER-001-build-financial-dashboard - Add publisher sales rollups, royalties, and contract management
- [done] TASK-QUALITY-001-test-checkout-payments - Add checkout and hosted-payment regression coverage (improvement)
- [done] TASK-QUALITY-002-test-vendor-payouts - Add vendor payout regression coverage (improvement)
- [done] TASK-QUALITY-003-test-b2b-pipeline - Add B2B quote-pipeline regression coverage (improvement)
- [done] TASK-REBUILD-001-bootstrap-platform-foundation - Bootstrap the greenfield platform foundation
- [done] TASK-REBUILD-002-build-identity-and-access-core - Build identity and access control core
- [done] TASK-REBUILD-003-build-shared-web-foundations - Build shared web foundations
- [done] TASK-REBUILD-004-build-catalog-and-marketplace-core - Build catalog and marketplace core
- [done] TASK-REBUILD-005-build-storefront-cart-and-checkout - Build storefront cart and checkout
- [done] TASK-REBUILD-006-build-customer-support-features - Build customer support features
- [done] TASK-REBUILD-007-build-admin-commerce-operations - Build admin commerce operations
- [done] TASK-REBUILD-008-build-vendor-portal-and-payouts - Build vendor portal and payouts
- [done] TASK-REBUILD-009-build-employee-and-retail-operations - Build employee and retail operations
- [done] TASK-REBUILD-010-build-notification-and-preferences - Build notification and preferences
- [done] TASK-REBUILD-011-define-and-build-live-notifications - Define and build live notifications
- [done] TASK-REBUILD-012-define-supplier-portal-scope - Define supplier portal scope
- [done] TASK-REBUILD-013-build-b2b-quote-pipeline - Build B2B quote pipeline
- [done] TASK-REBUILD-014-build-b2b-order-contract-po-flow - Build B2B order, contract, and PO flow
- [done] TASK-REBUILD-015-build-institution-buyer-portal - Build institution buyer portal
- [done] TASK-REBUILD-016-define-royalty-and-earnings-policy - Define royalty and earnings policy
- [done] TASK-REBUILD-017-build-publisher-portal-and-royalties - Build publisher portal and royalties
- [done] TASK-REBUILD-018-build-author-portal-and-earnings - Build author portal and earnings
- [done] TASK-REBUILD-019-build-email-and-zalo-integrations - Build email and Zalo integrations
- [done] TASK-REBUILD-020-build-vietnamese-search - Build Vietnamese search
- [done] TASK-REBUILD-021-build-wordpress-import-compatibility - Build WordPress import compatibility
- [done] TASK-REBUILD-022-establish-quality-and-preview-release - Establish quality and preview release
- [done] TASK-REBUILD-023-prove-b2c-parity-and-plan-cutover - Prove B2C parity and plan cutover
- [on_hold] TASK-RETAIL-001-add-order-processing-actions - Add retail order-processing actions
- [on_hold] TASK-RETAIL-002-add-returns-workflow - Add the returns workflow
- [done] TASK-ROYALTY-001-model-royalties-and-earnings - Model royalties and earnings
- [on_hold] TASK-SECURITY-001-retire-maintenance-endpoints - Retire exposed maintenance debug endpoints (improvement)
- [on_hold] TASK-SUPPLIER-001-resolve-portal-scope - Resolve and implement the supplier portal scope
- [on_hold] TASK-VENDOR-001-verify-vendor-fulfillment - Verify vendor fulfillment and tracking behavior (improvement)
- [on_hold] TASK-VENDOR-002-add-dashboard-analytics - Add vendor dashboard analytics with real API data
- [on_hold] TASK-VENDOR-003-add-report-export - Add vendor report export

## in flight

- (implementing / reviewing / testing tasks appear here)

## done

- (shipped tasks, for the audit trail)

## on_hold / closed

- (deferred or killed tasks)
- [on_hold] TASK-CUTOVER-002-execute-wordpress-cutover - Execute the approved WordPress cutover
- [closed] TASK-B2B-001-add-quote-click-through - Add B2B quote-kanban click-through
- [closed] TASK-B2B-003-manage-contracts-and-pos - Manage B2B contracts and purchase-order artifacts
- [closed] TASK-EMAIL-001-enable-transactional-email - Enable transactional email flows
- [closed] TASK-EMPLOYEE-002-add-real-dashboard-kpis - Replace mocked employee dashboard KPIs with real data
- [closed] TASK-INSTITUTION-001-add-budget-tracking-and-pos - Add institutional budget tracking and PO submission
- [closed] TASK-INSTITUTION-002-deliver-purchased-marc-records - Deliver MARC records for purchased titles
- [closed] TASK-NOTIFICATIONS-002-add-live-notifications - Add live notification delivery
- [closed] TASK-SEARCH-001-add-vietnamese-fuzzy-search - Add Vietnamese fuzzy search with Meilisearch
