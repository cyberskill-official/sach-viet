# 07 — Current Status, Roadmap, Known Issues

Snapshot: 2026-07-11. Living source of truth: `app/TODO.md` (check it first — it moves).

## What is DONE and verified in production preview

- **B2C storefront end-to-end**: browse → product → cart (add-ons) → Stripe/PayPal hosted checkout → order history w/ timeline
- **Performance pass (Jun 2026)**: server-side pagination/sort — shop payload 11.3MB → 274KB (41×), cold load 18.8s → 0.85s (22×), 8 new DB indexes
- **Multi-vendor Phase A**: ProductVendor, PrimaryVendorService, admin vendor-product assignment
- **WP data import**: 1,633 orders / 4,061 order items matched and imported; WP users auth via PHPass compat
- **Auth hardening**: httpOnly cookie proxy, per-email login throttle, HMAC internal API
- **Support tickets** (policy-gated), **goods requests** (+ Zalo job), **reviews** (verified badge + spam guard), **wishlist share links**, **search analytics + suggestions**
- **Admin portal**: real dashboard, vendor approval, order status management, payouts, banners/ads/promotions
- **B2B/retail/employee dashboards**: wired to real `/dashboard` extended payload (pipeline, approval queue)
- **Notification system backend** + per-portal preference pages
- **i18n vi/en**, 3-theme system, 8 portal layouts

## In flight / partially done

| Item | State | Missing |
|---|---|---|
| Notification bell | backend done | E2E verify badge+deeplink across 5 portals (needs owner login) |
| Employee home-config editor | UI exists | not wired to backend |
| Vendor dashboard analytics | page exists | data mocked; report download stub |
| Publisher/author dashboards | pages exist | fully mocked — blocked on royalty/earnings product decision |
| Institution dashboard | page exists | budget/PO tracking not designed yet |
| Returns workflow (retail) | page exists | no backend |

## Not started (the meat of the next phase)

1. **Quote → order conversion** (B2B pipeline end)
2. **Royalty/earnings model** (unblocks publisher + author portals)
3. **Real-time notifications** (Reverb/Pusher decision)
4. **Meilisearch** fuzzy search
5. **Email flows** (templates exist; SMTP creds = owner blocker)
6. **Supplier portal** (role + middleware placeholder only)
7. **WP cutover plan** for `sachviet.us` → Nuxt (after parity)

## Known issues / tech debt (inherited list — verify before fixing)

1. `DataTable.vue` pagination text hardcoded Vietnamese (not i18n)
2. `supplier.ts` middleware uses legacy redirect pattern
3. `portal/login.vue` legacy but still referenced from `error.vue`
4. Duplicate dashboard stats endpoints (consolidate someday)
5. Maintenance debug endpoints (`/admin/maintenance/*` via HMAC) still exposed — remove after vendor dashboard verified
6. 324 WP order items unmatched (Vietnamese slug edge cases) — low priority
7. B2B pipeline kanban cards have no click-through routes

## Context: the parallel WordPress migration (July 2026, owner-driven)

Not this team's task, but affects you: the legacy WP store (live revenue) is moving from Liquid Web to CapRover apps `sachviet-current`/`sachviet-current-db` (deadline Jul 23). Until Nuxt parity, WP stays the live store and `WpImport` keeps syncing its data in. Full details: `migration/README.md`.

## Suggested first-two-weeks plan for the incoming team

1. **Week 1 — orientation**: read this package + `project_full_map.md`; get CapRover + GitHub access; deploy a trivial change to preview; log in as every role (TEST_ACCOUNTS); trace one order through checkout on preview.
2. **Week 2 — first real work** (proposals, discuss priority with owner):
- Wire employee home-config editor (small, self-contained, touches both halves)
- Notification bell E2E + fix what falls out
- Written proposal for royalty model (unblocks two portals)
