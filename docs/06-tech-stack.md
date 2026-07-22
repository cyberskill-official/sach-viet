# 06 — Tech Stack: Current, Recommended, Open for Discussion

## Current stack (working in production preview — don't rewrite without a reason)

| Layer | Choice | Why it's there |
|---|---|---|
| Frontend | **Nuxt 4 / Vue 3 / TypeScript** | SSR for SEO on storefront; file-based routing maps cleanly to 9 portals |
| Styling | Tailwind + custom "liquid glass" theme (light/dark/glass) | Brand signature; CSS-only effects, `prefers-reduced-motion` honored |
| State | Pinia (9 stores) + VueUse localStorage persistence | |
| i18n | @nuxtjs/i18n — vi/en | |
| Charts | Chart.js | |
| Tests | Vitest (frontend); minimal API tests | |
| Backend | **Laravel 10 / PHP 8.1 / Sanctum** | Team familiarity, WP-adjacent PHP skills transfer, mature ecosystem |
| DB | SQLite (12MB, on Docker volume) | Zero-ops at current scale |
| Cache/session | Redis (shared CapRover app) | |
| Auth | Sanctum bearer → httpOnly cookie via Nuxt proxy | XSS-hardened; see 04 |
| Payments | Stripe + PayPal hosted checkout | Live keys in production env |
| Media | BunnyCDN (`assets.sachviet.us`) over WP uploads + EWWW optimizer | |
| Hosting | CapRover (Docker PaaS) on Contabo VPS 8c/20GB | Cheap, owner-controlled |
| CI/CD | GitHub Actions + `deploy.sh` (tar → CapRover token) | |

## Recommendations (owner's stance: recommend ≠ mandate — discuss before changing)

### Keep as-is (high confidence)
1. **Nuxt + Laravel split with the auth proxy pattern.** It works, it's secure, and both halves are conventional. Rewriting is the classic new-team trap; ship features instead.
2. **CapRover hosting** — verified capacity headroom (July 2026: load 0.18, 16GB RAM free, 94GB disk free). Cloudflare sits in front.
3. **Single-role authorization** — the 9-role single-column model covers every current requirement with near-zero complexity.

### Upgrade when a trigger fires (not before)
| Change | Trigger |
|---|---|
| SQLite → MySQL/Postgres | Concurrent-write pain (multiple vendors mutating orders simultaneously), or need for replicas/backups beyond file copy. Migration is a day's work with Laravel migrations — don't pre-pay it. |
| Meilisearch for fuzzy/typo search | Search quality complaints in vi diacritics; planned already in TODO (self-host on CapRover) |
| Laravel Reverb (self-host) or Pusher for real-time | When notification bell needs live push instead of poll |
| Queue worker (Redis-backed, dedicated container) | When Zalo/email jobs grow beyond the current inline volume |
| Frontend on Cloudflare Workers (Nitro `cloudflare` preset) | If global TTFB matters post-launch; API must stay on a PHP host regardless |

### Known dead-ends (don't spend time here)
- **PHP on Cloudflare** — impossible; Workers run JS/WASM only. The API stays on a server.
- **Static-exporting the storefront** — checkout/cart/portals are dynamic; SSR stays.
- **Replacing Dokan/WP piecemeal** — the plan is parity-then-cutover, not hybrid frankenstein. WP is read-only legacy synced via `WpImport`.

## Open discussion topics for the first call

1. **Team's stack comfort** — if the team is stronger in something else (e.g., NestJS/Node), the API is the negotiable half *after* WP cutover; frontend should stay Nuxt (too much built).
2. **Real-time strategy** — Reverb vs Pusher vs polling for notifications.
3. **Testing bar** — currently thin. Propose: Vitest components + Laravel feature tests on the money paths (checkout, payouts, quotes) before anything else.
4. **Search** — Meilisearch timing and Vietnamese analyzer config.
5. **Royalty/earnings model** for publisher/author portals — needs product decision before backend work (see 03/07).
6. **Mobile** — nothing exists; PWA of the Nuxt storefront is the cheap first step if wanted.

## Working agreements with the owner (Austin)

- Recommend freely, but **discuss before switching core tech**.
- Preview deploy per change; verify on real URL (`*.server.sachviet.us`).
- All repos private; secrets never in git; English deliverables.
- Blockers needing owner: any credential (SMTP, Zalo OA, Google OAuth, Sentry, GA4), spending money, admin-session actions.
