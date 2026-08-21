# i18n, guided tours, Features page — 2026-08-21

**Task:** `TASK-UI-005`  
**Branch:** `feat/i18n-tours-features`  
**PR:** https://github.com/cyberskill-official/sach-viet/pull/45

## Scope (platform-wide)

Tours and UI polish apply to the **whole platform**, not only storefront / Features / account from the initial PR slice.

## What shipped

1. **Default locale `en`** via `normalizeLocale` / `DEFAULT_LOCALE` in `app/web/src/lib/i18n/index.mjs` (re-exported from `web-foundations.mjs`).
2. **`LocaleProvider`** + boot script in root layout: cookie + `localStorage` key `sv_locale`; resolution `?lang=` → cookie/storage → `users.locale` → `en`.
3. Message catalogs EN/VI under `app/web/src/lib/i18n/messages-*.mjs` (namespaces: common/nav/auth/storefront/cart/orders/account/support/features/tours/validation/portals/admin + wishlist/product).
4. **React Joyride** tours (`TourProvider`), registry ids below, `data-tour` targets, localStorage `sv_tour_progress`, migration **`008_user_tour_progress`**, API `GET/PATCH /api/account/tours`.
5. **`/features`** catalog with `available|restricted|upcoming` aligned to interim DECs + **full tour index** (start any tour). CDS Thủy·ocean only.

## Platform-wide tour coverage

| Tour id | Surfaces / routes | Auto-start |
| --- | --- | --- |
| `tour.storefront` | `/`, `/ecom` | yes (once if pending) |
| `tour.product_cart` | `/products/*`, `/ecom/cart` (multi-route; only present targets) | yes |
| `tour.orders` | `/ecom/orders` | yes |
| `tour.account` | `/account` | yes |
| `tour.wishlist` | `/wishlist` | yes |
| `tour.support` | `/support` | yes |
| `tour.features` | `/features` | yes |
| `tour.auth` | `/login`, `/register` | **no** (manual / Features only) |
| `tour.portal_overview` | shared shell steps (nav + language) | via Features |
| `tour.portal_admin` | `/admin` | yes |
| `tour.portal_vendor` | `/vendor` | yes |
| `tour.portal_employee` | `/employee` | yes |
| `tour.portal_retail` | `/retail` | yes |
| `tour.portal_b2b` | `/b2b` | yes |
| `tour.portal_institution` | `/institution` | yes |
| `tour.portal_publisher` | `/publisher` | yes |
| `tour.portal_author` | `/author` | yes |
| `tour.portal_supplier` | `/supplier` (retired empty state) | yes |

### Entry points

- Storefront header Tour control → `tour.storefront`
- Portal-shell header Tour control → `tour.portal_<role>` for that portal
- Wishlist / support / orders chrome: Features + language + Tour
- Auth forms: Features + language + Tour (no auto-start)
- Features page: per-feature launchers + **tour index** listing every `TOUR_IDS` entry
- Auto-start: once per tour id when route matches and status is not `completed` / `dismissed` / `in_progress` (auth excluded)

## Product polish (platform pass)

| Area | Fix |
| --- | --- |
| CI / lint | Removed sync `setState` in `LocaleProvider` effect (was failing `react-hooks/set-state-in-effect`) |
| Tours a11y | `disableFocusTrap: true`; `skipScroll` when `prefers-reduced-motion`; missing targets filtered before run |
| Admin chrome | Vendor apps / payouts / catalog / flags panels fully wired through `t()` (`admin.*` keys); `data-tour` panel targets |
| Role portals | Removed VI/EN ternaries; portal banners + actions + aria-labels via catalog keys; `data-tour=portal-panel|portal-primary` |
| Auth / forbidden | Login/register chrome + hints localized; forbidden page localized |
| Notifications | Labels/errors via `t()`; close control labeled |
| Responsive | Storefront / Features / portal / B2C headers stack on small viewports; search form stacks; long VI strings wrap |
| `html lang` | Boot script + provider keep `document.documentElement.lang` in sync |

### Verification

- `npm run lint` — 0 errors (pre-existing warnings unrelated if any)
- `npx tsc --noEmit` — pass
- `npm test` — unit suite including platform-wide tour registry completeness
- Playwright `e2e/fl-smoke.spec.mjs` — needs live app + seed Postgres / `.seed-password`
- Manual / code review: locale resolve order, tour skip→dismissed, Features CTAs, no new purple/glow chrome

### Remaining known issues

- Multi-route `tour.product_cart` shows only targets present on the current page (revisit cart after PDP to cover checkout steps)
- Deep role-portal row labels still mix English status tokens (`packing`, `shipped`, API status strings) — intentional operational vocabulary
- Email/cron outbox localization still out of scope
- HITL review / final acceptance for `TASK-UI-005` still required before merge/deploy

## Operator notes

- Do not invent DEC rates or flip live PV3 / Zalo OA.
- Apply migration 008 via normal DB open / `npm run migrate` path (registry entry required).
- Playwright smoke expects English storefront/cart/orders/admin headings by default.

## HITL

Review and final acceptance gates still apply per CyberOS (`reviewing → ready_to_test`, `testing → done`). Do not merge/deploy without operator instruction.
