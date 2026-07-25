# 03 — The 9 Portals: What Each Does, What's Real, What's Needed

> **Archived handoff context — not current implementation truth.** Paths, implementation statuses, and framework references below describe the superseded Nuxt/Laravel handoff and may overstate current UI coverage. The active code is the Next.js application in `app/web`. Use `docs/07-status-roadmap.md` for current scope/status and `app/web/OPERATIONS.md` for operational guidance.

Every portal = its own folder in `web/pages/`, its own layout + accent color, its own login page, its own middleware guard. Full page-by-page detail: `app/misc/docs/project_full_map.md`.

Status legend: ✅ wired to real API · 🟡 partially real · 🔴 mocked/stub

---

## 1. `/ecom` — Customer storefront (B2C) — the most complete portal

**Who:** Public shoppers. **Layout:** default (TheHeader/TheFooter).

| Area | Status | Notes |
|---|---|---|
| Home (hero, carousels, flash sale, personalized rows) | ✅ | Home layout configurable via HomeSection API |
| Shop: browse/filter/sort/pagination | ✅ | Server-side pagination + 7 sort options (24/page) |
| Product detail + gallery + reviews + add-ons (cover/gift) | ✅ | Reviews have verified-purchase badge + spam throttle |
| Cart + Stripe/PayPal checkout | ✅ | Hosted checkout (no in-app card form) |
| Orders + status timeline | ✅ | 1,633 real orders imported from WP |
| Wishlist (+ share via public link) | ✅ | |
| Support tickets | ✅ | 8-layer security model, policies |
| Goods requests ("find me this book") | ✅ | Triggers Zalo notification job |
| Auth: register/login/OAuth callback/password reset | ✅ | Per-email rate limiting |
| Vendor self-registration | ✅ | Feeds admin approval queue |

**Needed next:** notification bell E2E verification, fuzzy search (Meilisearch planned), email flows blocked on SMTP creds.

## 2. `/vendor` — Marketplace sellers (emerald)

**Who:** Third-party book sellers. Products CRUD ✅ · incoming orders (read-only) ✅ · payouts history ✅ · **dashboard KPIs/charts 🔴 mocked** · "Download Report" button is a stub. **Needed:** real dashboard analytics API, report export, order fulfillment actions (mark shipped w/ tracking exists via modal — verify E2E).

## 3. `/admin` — Owner/superuser portal (blue, 13 nav sections)

Dashboard ✅ (real stats/revenue/recent orders) · products/orders/categories/vendors(approve-reject)/payouts/banners/sidebar-ads/promotions/settings ✅ · B2B quotes + publishing request review ✅ pages exist. **Needed:** settings sub-pages (Zalo/email) depend on integration creds; consolidate duplicate stats endpoints (tech debt).

## 4. `/employee` — Internal staff hub (indigo, role-filtered nav)

Nav filters by sub-role (B2C vs B2B staff). Approval queue wired ✅ from `/dashboard` payload; users management (admin-only) page exists. **Dashboard KPIs partially mocked 🟡.** `home-config` edit UI not yet wired to backend 🔴.

## 5. `/retail` — B2C ops staff (employee_b2c)

Orders (read-only) ✅ · tickets/goods-requests queues ✅ · returns/customers pages exist 🟡. **Needed:** order processing actions (currently display-only), returns workflow backend.

## 6. `/b2b` — Institutional sales staff (employee_b2b)

Dashboard quote pipeline kanban ✅ (real `quotes_pipeline` data) · quotes management ✅ · institutions/publishers lists 🟡. **Needed:** pipeline cards have no click-through routes; quote → order conversion flow; contract/PO artifacts.

## 7. `/institution` — Library & school buyers (sky)

Catalog ✅ · quotes ✅ · selection lists ✅ · dashboard (budget/approvals) 🔴 display-only. **Needed:** real budget tracking, PO submission, MARC record delivery for purchased titles. This portal is strategically important (see 01-vision).

## 8. `/publisher` — Publishing houses (purple)

Product list/submit ✅ pages · MARC upload ✅ (MarcParser service) · **dashboard (royalties/sales/contracts) 🔴 fully mocked**. **Needed:** royalty model + real sales rollups per publisher, contract management.

## 9. `/author` — Self-publishing authors (orange)

Submit manuscript ✅ (PublishingRequest + log trail) · requests list/detail ✅ · **dashboard (earnings/stages) 🔴 mocked**. **Needed:** real manuscript pipeline stages, earnings once royalty model exists.

---

## Cross-cutting systems (shared by all portals)

| System | Status | Notes |
|---|---|---|
| Notifications (in-app bell + preferences per portal) | 🟡 | Backend + prefs done; E2E badge/deeplink verify pending; real-time (WebSocket/SSE) not built |
| i18n vi/en | ✅ | Some hardcoded VI strings left in DataTable pagination |
| Theme system (light/dark/glass) | ✅ | Glass = signature "liquid glass" aesthetic |
| Multi-vendor engine (ProductVendor + PrimaryVendorService) | ✅ | Phase A complete |
| Payouts (vendor settlement) | ✅ | Payout + PayoutItem, admin-managed |
| Audit log | ✅ | AuditLog model |
| WP sync (`WpImport`) | ✅ | One-way legacy → new; keep until WP retired |
