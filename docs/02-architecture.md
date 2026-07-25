# 02 — Architecture, Structure Tree, Environments

> **Archived handoff context — not current implementation truth.** The Nuxt/Laravel architecture and environment details below describe a legacy plan, not this checkout. The active code is the Next.js application in `app/web`. Use `docs/07-status-roadmap.md` for current scope/status and `app/web/OPERATIONS.md` for operational guidance. Do not use this file as a deployment runbook.

## System diagram

```
                        ┌─────────────────────────────┐
        Cloudflare ────▶│  sachviet.us (PROD, legacy) │  WordPress+Woo+Dokan
        (DNS+proxy)     │  → moving to CapRover app    │  (until Nuxt replaces it)
                        │    "sachviet-current"        │
                        └─────────────────────────────┘
                        ┌─────────────────────────────┐
   NEW PLATFORM         │  CapRover (Contabo VPS)      │  captain.server.sachviet.us
                        │  212.28.185.211              │  8 vCPU / 20GB RAM / 193GB
                        │                              │
   Browser ──HTTPS──▶   │  sachviet-web  (Nuxt 4 SSR)  │
                        │      │ /api/* proxy           │
                        │      ▼                        │
                        │  sachviet-api  (Laravel 10)  │──▶ SQLite (volume svgit-api-db)
                        │      │                        │──▶ redis (cache/session)
                        └──────┼───────────────────────┘
                               ▼
                     Stripe / PayPal (hosted checkout)
                     assets.sachviet.us (BunnyCDN — WP media)
```

**Request flow:** Browser → Nuxt SSR (`sachviet-web`) → Nuxt server proxy `web/server/api/[...path].ts` (injects auth token from httpOnly cookie `sv_auth`) → Laravel REST (`sachviet-api`) → SQLite. The browser never sees the Sanctum token.

## Repo structure (the part the team owns: `app/`)

```
app/
├── web/                  FRONTEND — Nuxt 4 / Vue 3 / TypeScript / Tailwind / Pinia
│   ├── pages/            File-based routes, one folder per portal:
│   │   ├── ecom/           B2C storefront (26 pages: shop, product, cart, orders…)
│   │   ├── admin/          Admin portal (18 pages)
│   │   ├── vendor/         Vendor portal (10 pages)
│   │   ├── publisher/      Publisher portal (5 pages)
│   │   ├── author/         Author portal (5 pages)
│   │   ├── institution/    Library/school buyer portal (7 pages)
│   │   ├── b2b/            Internal B2B sales staff (5 pages)
│   │   ├── retail/         Internal retail ops staff (12 pages)
│   │   ├── employee/       Internal staff portal (11 pages)
│   │   └── portal/         Portal landing/login pages
│   ├── components/       ~40 shared components (DataTable, PortalLoginForm, Glass*, charts)
│   ├── layouts/          8 layouts — one per portal, each with its own accent color
│   ├── middleware/       10 route guards (see 04-roles-permissions.md)
│   ├── stores/           9 Pinia stores (auth, cart, product, wishlist…)
│   ├── composables/      useApi, useTheme (light/dark/glass), useHomeConfig…
│   ├── server/           Nuxt server routes: API proxy, sitemap, adopt-token
│   ├── i18n/locales/     vi / en
│   └── tests/            Vitest
│
├── api/                  BACKEND — Laravel 10 (PHP 8.1) + Sanctum
│   ├── app/Http/Controllers/   ~35 controllers
│   ├── app/Models/             ~45 Eloquent models
│   ├── app/Services/           PrimaryVendorService, NotificationService,
│   │                           MarcParser, ProductHydrator, EwwwImageService…
│   ├── app/Policies/           SupportTicketPolicy, GoodsRequestPolicy…
│   ├── routes/api.php          REST routes with role middleware
│   ├── database/               65+ migrations, database.sqlite
│   └── docker/ + captain-definition   CapRover packaging
│
├── _wp_data/             One-time WordPress migration data + scripts
├── docs/architecture.md  Original architecture doc
├── misc/                 deploy.sh, TEST_ACCOUNTS, project_full_map.md
└── local/                Gitignored: credentials, scratch notes
```

The wider workspace (`SachViet/`) also contains satellite tools (book scraper, pricing calculator, order tracker, ASIN finder) — documented in the root `README.md`. They feed data/pricing into the main app but are separate deliverables.

## Databases (three separate systems — do not confuse)

| System | DB | Where |
|---|---|---|
| New platform (`sachviet-api`) | **SQLite** — single file, 12MB, volume `svgit-api-db` | CapRover |
| Legacy WordPress (live store) | MySQL 1.6GB, 269 tables | Nexcess → moving to CapRover `sachviet-current-db` (MySQL 8.0) |
| Book scraper | PostgreSQL | CapRover `svscraper-db` |

SQLite is a deliberate choice at current scale (small writes, one API container). Moving to MySQL/Postgres is a known future step if concurrent writes grow — discuss before doing it.

## Environments & deploy

| What | How |
|---|---|
| Deploy web/api | `bash app/misc/deploy.sh` — tars source, pushes to CapRover via app token; or GitHub Actions CI/CD |
| Preview URLs | `https://sachviet-web.server.sachviet.us` / `https://sachviet-api.server.sachviet.us` |
| CapRover dashboard | `https://captain.server.sachviet.us` |
| Media CDN | `https://assets.sachviet.us` (BunnyCDN pull zone over WP uploads) |
| Mail/aux services | Separate Cloudron host (SSDNodes) — mail, n8n, Gitea, NocoDB |

**Convention: never run the app locally.** Verify every change on the CapRover preview URL. One-shot commands (build, test, lint, `tsc --noEmit`) are fine locally.
