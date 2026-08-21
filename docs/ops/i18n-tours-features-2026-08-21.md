# i18n, guided tours, Features page — 2026-08-21

**Task:** `TASK-UI-005`  
**Branch:** `feat/i18n-tours-features`

## What shipped

1. **Default locale `en`** via `normalizeLocale` / `DEFAULT_LOCALE` in `app/web/src/lib/i18n/index.mjs` (re-exported from `web-foundations.mjs`).
2. **`LocaleProvider`** + boot script in root layout: cookie + `localStorage` key `sv_locale`; resolution `?lang=` → cookie/storage → `users.locale` → `en`.
3. Message catalogs EN/VI under `app/web/src/lib/i18n/messages-*.mjs` (namespaces: common/nav/auth/storefront/cart/orders/account/support/features/tours/validation/portals + wishlist/product).
4. **React Joyride** tours (`TourProvider`), registry ids `tour.storefront|product_cart|account|features|portal_overview`, `data-tour` targets, localStorage `sv_tour_progress`, migration **`008_user_tour_progress`**, API `GET/PATCH /api/account/tours`.
5. **`/features`** catalog with `available|restricted|upcoming` aligned to interim DECs (sandbox pay available; live PV3 / Zalo / tax>0 / Auth cutover upcoming; settlement/royalty restricted). CDS Thủy·ocean only.

## Operator notes

- Do not invent DEC rates or flip live PV3 / Zalo OA.
- Apply migration 008 via normal DB open / `npm run migrate` path (registry entry required).
- Playwright smoke expects English storefront/cart/orders/admin headings by default.

## HITL

Review and final acceptance gates still apply per CyberOS (`reviewing → ready_to_test`, `testing → done`). Do not merge/deploy without operator instruction.
