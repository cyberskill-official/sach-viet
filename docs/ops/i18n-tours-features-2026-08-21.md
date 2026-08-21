# i18n, guided tours, Features page — 2026-08-21

**Task:** `TASK-UI-005`  
**Branch:** `feat/i18n-tours-features`  
**PR:** https://github.com/cyberskill-official/sach-viet/pull/45

## What shipped

1. **Default locale `en`** via `normalizeLocale` / `DEFAULT_LOCALE` in `app/web/src/lib/i18n/index.mjs` (re-exported from `web-foundations.mjs`).
2. **`LocaleProvider`** + boot script in root layout: cookie + `localStorage` key `sv_locale`; resolution `?lang=` → cookie/storage → `users.locale` → `en`.
3. Message catalogs EN/VI under `app/web/src/lib/i18n/messages-*.mjs` (namespaces: common/nav/auth/storefront/cart/orders/account/support/features/tours/validation/portals/admin + wishlist/product).
4. **React Joyride** tours (`TourProvider`), registry ids `tour.storefront|product_cart|account|features|portal_overview`, `data-tour` targets, localStorage `sv_tour_progress`, migration **`008_user_tour_progress`**, API `GET/PATCH /api/account/tours`.
5. **`/features`** catalog with `available|restricted|upcoming` aligned to interim DECs (sandbox pay available; live PV3 / Zalo / tax>0 / Auth cutover upcoming; settlement/royalty restricted). CDS Thủy·ocean only.

## Product polish (follow-up on PR #45)

Completed in the polish pass:

| Area | Fix |
| --- | --- |
| CI / lint | Removed sync `setState` in `LocaleProvider` effect (was failing `react-hooks/set-state-in-effect`) |
| Tours a11y | `disableFocusTrap: true`; `skipScroll` when `prefers-reduced-motion`; portal/PDP placements use `auto`; Features tour order matches visual layout |
| Admin chrome | Vendor apps / payouts / catalog / flags panels fully wired through `t()` (`admin.*` keys) |
| Role portals | Removed VI/EN ternaries; portal banners + actions use catalog keys |
| Auth / forbidden | Login hint + forbidden page localized |
| Notifications | Labels/errors via `t()`; close control labeled |
| Responsive | Storefront / Features / portal headers stack on small viewports; search form stacks; long VI strings wrap (`break-all` / `min-w-0`) |
| `html lang` | Boot script + provider keep `document.documentElement.lang` in sync |

### Verification

- `npm run lint` — 0 errors (2 pre-existing warnings unrelated)
- `npx tsc --noEmit` — pass
- `npm test` — **268/268** pass
- Playwright `e2e/fl-smoke.spec.mjs` — **not run** in polish pass (needs live app + seed Postgres / `.seed-password`); code-reviewed smoke assertions for EN default remain valid
- Manual / code review: locale resolve order, tour skip→dismissed, Features CTAs for available vs learn, no new purple/glow chrome

### Remaining known issues

- Multi-route tours (`tour.product_cart`) still advance past missing targets via Joyride `TARGET_NOT_FOUND` (expected until a single-page flow exists)
- Deep role-portal row labels still mix English status tokens (`packing`, `shipped`, API status strings) — intentional operational vocabulary, not full prose i18n
- Email/cron outbox localization still out of scope
- HITL review / final acceptance for `TASK-UI-005` still required before merge/deploy

## Operator notes

- Do not invent DEC rates or flip live PV3 / Zalo OA.
- Apply migration 008 via normal DB open / `npm run migrate` path (registry entry required).
- Playwright smoke expects English storefront/cart/orders/admin headings by default.

## HITL

Review and final acceptance gates still apply per CyberOS (`reviewing → ready_to_test`, `testing → done`). Do not merge/deploy without operator instruction.
