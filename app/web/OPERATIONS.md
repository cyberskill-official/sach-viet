# Operations

This package is the SachViet greenfield Next.js application. Identity is custom `sv_session` (HMAC) plus register/verify/reset. Data is **Postgres** (Compose publishes `127.0.0.1:54329`; this cloud VM may use `127.0.0.1:5432`). There is no WordPress DNS cutover in this package.

Commerce mutations can be frozen by deploying `COMMERCE_MUTATIONS_ENABLED=0` (unset allows writes so Production stays up until that deploy). Never `seed:local` against Supabase Production. Never set `sk_live_` or `PAYPAL_MODE=live`.

## Required checks

Run these commands from `app/web` before proposing a review:

```bash
npm run lint
npm run test
npm run verify
npm run build
```

Then run the repo CyberOS gate from the repository root:

```bash
bash .cyberos/cuo/gates/run-gates.sh
```

Use `npm run test:coverage` when collecting Node test coverage for the foundation check. Use `npm run quality` to run lint, test, verify, and build in one local/CI pass.

## Container packaging

Build the production image without starting an application process (from `app/web`):

```bash
docker build --tag sachviet-web-foundation:local .
```

`captain-definition` is retained only for historical packaging verification. It is **not** a supported deploy path. Prefer Vercel + Supabase ([`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md)). Do not deploy without an explicit operator instruction.

### Local Docker (production-like)

Use Compose under `app/` to run the same production image locally against **Postgres**. This matches the Vercel + Supabase target shape. This is **not** a hot-reload / `next dev` stack.

**Prerequisites:** Docker Desktop or Engine with Compose.

1. Copy the env template and fill secrets (do not commit the real file):

```bash
cp app/.env.docker.example app/.env.docker
```

2. Set `AUTH_SESSION_SECRET` (at least 32 characters), for example:

```bash
openssl rand -hex 32
```

3. Prefer `ADMIN_EMAIL` + `ADMIN_PASSWORD` (plain; hashed at runtime on first login when the user store is empty). Fallback: set `BOOTSTRAP_ADMIN_EMAIL`, then generate `BOOTSTRAP_ADMIN_PASSWORD_HASH` from `app/web` (prints one hash line; paste into `app/.env.docker` — never commit hash values or document sample hashes here). Prefer stdin so the password is not stored in shell history:

```bash
cd app/web
printf '%s' 'your-password' | npm run hash-password
```

`ADMIN_*` / `BOOTSTRAP_*` create the first admin only when the user store is empty — they do **not** reset an existing admin password.

**Production login fails with "Invalid email or password" after setting `ADMIN_*`:** the user store is almost certainly non-empty (check `GET /api/ready` → `identity.bootstrapEligible: false`). Bootstrap env vars only apply on an empty store. Use the credentials from the original Production bootstrap (2026-07-26/27 `wire:production` run), `/forgot` if SMTP is configured, or operator recovery: set `ADMIN_PASSWORD_SYNC=1` with `ADMIN_EMAIL` matching the **existing** admin row email (query Supabase `users` if unsure) and `ADMIN_PASSWORD` as the new password, redeploy, sign in once, then unset `ADMIN_PASSWORD_SYNC`.

**Change admin email on an existing store:** set `ADMIN_EMAIL` to the desired address (e.g. `admin@sachviet.us`), set `ADMIN_EMAIL_SYNC=1`, redeploy, then sign in once at `/login` using the **new** email (and current or synced password). Unset `ADMIN_EMAIL_SYNC` and redeploy. Requires exactly one admin row; fails if the target email is already taken by another user. Combine with `ADMIN_PASSWORD_SYNC=1` in the same deploy if you also need a new password.

4. From `app/` (explicit `cd` if you stayed in `app/web` after step 3), build and start in the background:

```bash
cd ../   # → app/
docker compose up -d --build
docker compose ps   # wait until db + web are healthy (port 127.0.0.1:3000)
```

Foreground (`docker compose up --build` without `-d`) also works if you want live logs in the terminal.

Compose starts Postgres (`db` on host `127.0.0.1:54329`) and sets `DATABASE_URL=postgres://sachviet:sachviet@db:5432/sachviet` for `web` / `seed`. Schema migrations apply automatically the first time the app opens the database (`npm run migrate` does the same against a host URL).

5. Open `http://127.0.0.1:3000`. First login at `/login` with the bootstrap email and password creates the first admin when the user store is empty. After seeding (next section), prefer the seeded `admin.seed@sachviet.test` account for walkthroughs.

6. Tear down (from `app/`):

```bash
docker compose down
```

Add `-v` only if you intend to reset the Postgres volume (`sachviet-pg`).

When SMTP, Zalo, Stripe webhook, or Meili env vars are unset, those integrations use recording stubs / local defaults.

### Admin AI (retired on Production)

`GET/PUT /api/admin/ai-settings` and `POST /api/admin/ai/chat` return **HTTP 410** when `NODE_ENV=production`. The admin UI no longer advertises the BYOK panel. Local/test cores remain for unit tests; do not treat admin AI as a Production operator path.

**Password hash `$` escaping (required):** scrypt hashes contain `$`. Docker Compose interpolates values from `app/.env.docker` (`env_file`). Escape every `$` as `$$` when pasting the hash (e.g. `scrypt$salt$digest` → `scrypt$$salt$$digest`). At runtime the container receives single `$` (verified with Compose v5). The same `$$` rule applies if you ever inline a hash under a service `environment:` key.

### Seeding local demo data

`app/web/scripts/seed-local.mjs` fills Postgres with a walkthrough dataset: three categories, ten Vietnamese book products (one deliberately out of stock), competing vendor offers, two vendors, two customers, one paid and one pending order, one vendor payout, one pending vendor application, notifications, a review, and a support ticket. It is **local development material only** and must never run against a deployed database. The script **refuses** when `NODE_ENV=production`.

The seed is idempotent. Catalog rows are upserted; orders, payouts, applications, notifications, and support records are created only when the seeded user has none. It also runs the first-admin bootstrap before creating any seed user, so an operator-configured `ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_EMAIL` account is still created rather than blocked by the seed data.

**Password hygiene:** the seed no longer prints the shared account password to stdout by default.

- Prefer `SEED_PASSWORD` (not printed).
- If unset, a generated password is written to `app/web/.seed-password` (mode `0600`, gitignored). Read it with `cat app/web/.seed-password`.

**Against Compose Postgres** (recommended; run from `app/` with the stack already up):

```bash
SEED_PASSWORD='<local-only-password>' docker compose --profile seed run --rm seed
```

Or omit `SEED_PASSWORD` and read `app/web/.seed-password` after the run. The `seed` service is a one-shot container that talks to the Compose `db` service. It never starts with `docker compose up`.

**Against a host Postgres** (for example when running `next dev` outside Docker), from `app/web`:

```bash
DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet npm run migrate
SEED_PASSWORD='<local-only-password>' DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet npm run seed:local
```

Every seeded account shares one password; re-running the seed resets all seeded accounts to the current password. Do not record the value in this file, in committed `.env` files, or in git.

Seeded accounts (`admin`, two `vendor`, two `customer`) all use the `@sachviet.test` reserved domain so they cannot collide with real addresses.

To reset to a clean database, tear down with `docker compose down -v`, bring the stack back up, and seed again.

### Local end-to-end smoke

Verified path (from `app/`, stack healthy + seeded). Replace `<seed password>` with your `SEED_PASSWORD` or the contents of `app/web/.seed-password`.

```bash
# Catalog / product / cart surfaces
curl -s http://127.0.0.1:3000/api/catalog/products | head -c 400
curl -s "http://127.0.0.1:3000/api/catalog/products?q=hoang%20tu%20be"   # ranks Hoàng Tử Bé first (diacritic-insensitive)
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/products/hoang-tu-be   # expect 200
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/ecom/cart                 # expect 200

# Customer checkout → pending order + Stripe-not-configured (when STRIPE_* unset)
curl -s -c /tmp/sv-cookies -X POST http://127.0.0.1:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"khach-hang.seed@sachviet.test","password":"<seed password>"}'
# Use a primaryOffer.id from /api/catalog/products (e.g. product hoang-tu-be)
curl -s -b /tmp/sv-cookies -X POST http://127.0.0.1:3000/api/checkout \
  -H 'content-type: application/json' \
  -d '{"items":[{"vendorOfferId":"<offer-id>","title":"Hoàng Tử Bé","quantity":1}]}'
# expect: {"error":"Stripe checkout is not configured."} (HTTP 400)
# and a new pending_payment row via GET /api/orders

# Admin login + dashboard
curl -s -c /tmp/sv-cookies -X POST http://127.0.0.1:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin.seed@sachviet.test","password":"<seed password>"}'
curl -s -b /tmp/sv-cookies http://127.0.0.1:3000/api/admin/commerce/dashboard
curl -s -o /dev/null -w '%{http_code}\n' -b /tmp/sv-cookies http://127.0.0.1:3000/admin   # expect 200
```

Then open `http://127.0.0.1:3000` for the storefront and `http://127.0.0.1:3000/admin` after signing in as the seeded administrator.

### Playwright Chromium smoke (`next start` + Compose Postgres)

TASK-TEST-002 happy/denial paths (Chromium only). Compose **Postgres** must be up and seeded. This starts a host `next start` on port 3100 (does not use the Compose `web` container). Test hooks and the checkout sandbox stub are **off** on Vercel.

From `app/web` after `npm run build`. Local `next start` is not used because this package emits `output: "standalone"` (same as Docker); Playwright starts `node .next/standalone/server.js` via `npm run start:standalone`.

```bash
npx playwright install chromium   # once per machine
DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet npm run test:e2e
```

Optional: `SEED_PASSWORD='…'` if `.seed-password` is absent; `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100` to reuse an already-running standalone server that has `TEST_HOOKS_ENABLED=1`, `TEST_HOOK_SECRET`, and `CHECKOUT_SANDBOX_STUB=1`. Never `sk_live_` or `PAYPAL_MODE=live`.

Expected local limits:

- **Local Playwright uses the sandbox checkout stub** (`CHECKOUT_SANDBOX_STUB=1` + `TEST_HOOKS_ENABLED=1`, never on Vercel). `POST /api/checkout` with `provider: "stub"` creates a `pending_payment` order and returns `{ checkout: { provider: "stub", url: "/ecom/orders/:id" } }`. Live Stripe keys and `PAYPAL_MODE=live` are refused.
- **Without the stub, checkout stops at Stripe when secrets are unset.** `POST /api/checkout` returns `400` with `Stripe checkout is not configured.` when `STRIPE_SECRET_KEY`, `STRIPE_SUCCESS_URL`, or `STRIPE_CANCEL_URL` is unset. With test-mode secrets in `app/.env.docker` (never commit) + Stripe CLI webhook forwarding, restart the stack and complete a session to reach `paid` and trigger confirmation email (SMTP or recording stub).
- **Email, Zalo, and Meilisearch** stay on recording stubs / local defaults when their env vars are unset. WordPress **fixture** import remains a test-only compatibility path (REBUILD-021); Production `POST /api/admin/wordpress-import/apply` returns 410.
- Only the admin portal has a populated dashboard. Other portals render the shared shell with an empty table or the pending-policy notice.

## Docker acceptance checklist (Wave 4)

Tracked gate before any cloud deploy. Short pointer: [`docs/docker-acceptance-gate.md`](../../docs/docker-acceptance-gate.md).

**Hard rules**

- **Vercel production deploy is forbidden** until every required row below is green with evidence (item **6** may be **deferred** until Stripe is registered — see row).
- **Vercel preview** may start only after local items **1–5** and **7** pass (item 6 optional/deferred).
- Historical Preview “Wave 5” ([`docs/ops/wave5-preview-go.md`](../../docs/ops/wave5-preview-go.md)) is superseded. The **sandbox Production candidate** checklist below is prepare-only and does **not** authorize merge, deploy, Production migrate, or DNS cutover.
- CapRover/SQLite remains transitional only and is not an escape hatch around this gate.

**Automated smoke** (stack up + seeded; from `app/web`):

```bash
npm run smoke:docker
# optional: SEED_PASSWORD='…' BASE_URL=http://127.0.0.1:3000 npm run smoke:docker
```

`smoke:docker` covers items 1 (`/api/health`), **1b (`/api/ready`)**, 3–5, and Production-retired admin AI 410s (7). `/api/ready` requires `CRON_SECRET` (plus `DATABASE_URL` and `AUTH_SESSION_SECRET`) to be present; values are never returned. Item 6 (paid Stripe path) is deferred until Stripe registration. Item 8 is the backup drill doc. Item 9 is quality + CI.

| # | Check | How | Evidence / status |
|---|---|---|---|
| 1 | Compose healthy; `/api/health` → Postgres OK; `/api/ready` → ready | `docker compose up -d --build` from `app/`; `curl -s http://127.0.0.1:3000/api/health` and `/api/ready`; `npm run smoke:docker` items 1 and 1b | **met** (health) — 2026-07-25 acceptance on `main` `ff2363b` (PR #19). **1b-ready** is in `scripts/smoke-docker.mjs` (TASK-TEST-002); requires `CRON_SECRET` in `app/.env.docker`. **Local 2026-08-13:** Compose `web` was down during Wave 4, so 1b was **not** exercised end-to-end against a running container |
| 2 | Seed idempotent; no default password stdout leak | `SEED_PASSWORD=… docker compose --profile seed run --rm seed` twice; confirm password not printed (file `.seed-password` or env only) | **met** — 2026-07-25 Compose seed ×2 idempotent; password not printed (SEED_PASSWORD / `.seed-password` path); recorded in [`docs/ops/backup-restore-drill.md`](../../docs/ops/backup-restore-drill.md) session notes |
| 3 | Login admin + customer | Seeded `admin.seed@sachviet.test` + `khach-hang.seed@sachviet.test`; smoke automates | **met** — smoke 3a/3b PASS (same session / `ff2363b`) |
| 4 | Catalog search + suggestions | `q=hoang tu be` ranks Hoàng Tử Bé; `/api/catalog/search/suggestions?q=hoang`; smoke automates | **met** — smoke 4a/4b/4c PASS |
| 5 | Cart → checkout pending path | Customer checkout without Stripe secrets → pending order + `Stripe checkout is not configured.`; smoke automates | **met** — smoke item 5 PASS (non-payment checkout proof while Stripe unset) |
| 6 | Stripe webhook → outbox path | **Deferred** until Stripe account registration is complete. When ready: Stripe test keys + CLI forward to `/api/webhooks/stripe`, complete Checkout → `paid` + `order_comms_outbox`. Non-payment checkout remains covered by item 5. | **deferred** — Stripe not registered; not a production prerequisite until payment is enabled |
| 7 | Admin AI retired on Production | `/api/admin/ai-settings` and `/api/admin/ai/chat` return 410 under `NODE_ENV=production`; UI panel hidden | **met** — smoke 7a/7b expect HTTP 410 |
| 8 | Postgres backup/restore drill | Follow § Postgres backup and restore; record in [`docs/ops/backup-restore-drill.md`](../../docs/ops/backup-restore-drill.md) | **met** — drill evidence + operator sign-off (plan *Clear production blockers (Stripe deferred)*); see drill doc |
| 9 | `npm run quality` + CI green | From `app/web` with `DATABASE_URL` set: `npm run quality`; confirm GitHub Actions Postgres CI green on the branch | **met** — CI green on `main` @ `ff2363b`: [actions/runs/30170121638](https://github.com/cyberskill-official/sach-viet/actions/runs/30170121638) (lint/test/verify/build with Postgres) |

Recording checklist evidence clears the Wave 4 gate for non-Stripe scope. It does **not** authorize Vercel Production promote, DNS cutover, or WordPress retirement — those still need an explicit operator go.

## Sandbox Production candidate (Wave 5 — prepare only)

**Status: prepare only. Do not execute from this document.** This section is the operator checklist for a sandbox Production *candidate*. It does **not** authorize push, merge, Vercel deploy, Production migrate, live Stripe/PayPal keys, or WordPress DNS.

Not the same as the superseded Preview note [`docs/ops/wave5-preview-go.md`](../../docs/ops/wave5-preview-go.md). Short golive pointer: [`docs/ops/production-go-2026-07-26.md`](../../docs/ops/production-go-2026-07-26.md) (Phase A already live; this wave is additional).

### HITL — do not advance task status

CyberOS HITL is still required at `reviewing → ready_to_test` and `testing → done`. Agents must not write verdict JSON.

Leave these tasks **`implementing`** until a human records verdict JSON. Do **not** mark `ready_to_test` or `done`:

- Existing eight (PR #28, already on `main`): `TASK-GOV-001`, `TASK-DATA-001`, `TASK-ID-001`, `TASK-SEC-002`, `TASK-COM-001`, `TASK-JOB-001`, `TASK-UI-001`, `TASK-TEST-001`
- This wave: `TASK-COM-002`, `TASK-PLT-001`, `TASK-JOB-002`, `TASK-OPS-001`, `TASK-API-001`, `TASK-SRCH-002`, `TASK-UI-002`, `TASK-TEST-002`

### Merge / branch

PR #28 audit work is already on `main`. Branch `cursor/local-complete-golive-wave` is **additional**. Merge it only after a **later** operator instruction. Do not push or open a merge from this checklist.

### Operator prepare steps (document now; run only after a later instruction)

Do these on a trusted machine against a **candidate** URL the operator names. Do **not** run them against live Production from this wave.

1. **HITL first.** Wait for human verdict JSON on the sixteen tasks above. Do not treat green local tests as acceptance.
2. **Merge** `cursor/local-complete-golive-wave` to `main` only when the operator explicitly says to merge. Then (and only then) promote the resulting commit as a Vercel Production candidate.
3. **Migrate Production schema** via the existing operator path ([`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md) § Apply migrations). From `app/web`, against the Supabase **direct** URL (port 5432), not the pooler:

   ```bash
   cd app/web
   export DATABASE_URL='postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'
   npm run migrate
   ```

   Confirm `schema_migrations` includes shipped ids through `007_storage_object_registry`. Do **not** run `npm run seed:local` against Production. Do **not** invent tax/shipping/commission/royalty rates.
4. **Secrets already required by cron / ready.** Vercel Production must have `CRON_SECRET` (Bearer for `GET /api/cron/drain-order-comms` every 5 minutes in `vercel.json`; also required *presence* on `GET /api/ready`). SMTP (`SMTP_HOST`, `SMTP_FROM`, and related) is the Production submitter for identity and order outbox drain; without it, Production mail stays `failed`, not `delivered`. Names only: [`.env.vercel.example`](./.env.vercel.example).
5. **Optional commerce freeze.** Deploy `COMMERCE_MUTATIONS_ENABLED=0` before promoting the candidate; unset or `1` after smoke if the operator wants writes open. Unset still means allow (Production stays writable until that env is deployed).
6. **Smoke the candidate URL** (not live Production unless the operator names that URL as the candidate):

   ```bash
   cd app/web
   BASE_URL=https://<candidate-host> npm run smoke:production
   ```

   Optional: `ADMIN_EMAIL` / `ADMIN_PASSWORD` (or `BOOTSTRAP_ADMIN_*` / `SMOKE_*`). Hard-fail ids: `health-postgres`, `catalog-list`, `admin-login`, `checkout-pending-path`.
7. **Sandbox payments only.** Stripe `sk_test_…` and `PAYPAL_MODE=sandbox`. `commerce-core.mjs` still refuses `sk_live_` and `PAYPAL_MODE=live`. Never set those on Vercel.

### Local leftover (Wave 4)

`npm run smoke:docker` includes check **1b-ready** (`GET /api/ready`). During Wave 4 on this branch, Compose `web` was down, so that check was **not** exercised end-to-end against a running container. Re-run `smoke:docker` with `web` healthy + `CRON_SECRET` in `app/.env.docker` before treating 1b as locally proven.

### What “golive ASAP” will and will not be

**Will be:** customers can register, browse, sandbox-pay, wishlist, and use support; staff, vendor, B2B, institution, publisher, and author can use real pages against real APIs locally and on a Production sandbox.

**Will not be:** taxed/shipped US retail, returns, vendor commission settlement, royalties, Google/MFA, private `app` schema, US data residency, WordPress cutover, or live charges.

Those remain the rest of [`docs/plans/sachviet-full-production-completion-plan.md`](../../docs/plans/sachviet-full-production-completion-plan.md) after signed `DEC-*` records. Empty templates live under `docs/decisions/`; do not fill rates.

## Vercel + Supabase Production

**Primary cloud target:** Vercel (`app/web`) + Supabase (Postgres). CapRover is transitional / superseded. Operator: **no Preview mode** — Production only.

Full operator steps (create project, pooler `DATABASE_URL`, migrations, Vercel Root Directory, env names, Production rules): [`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md). Env name template: [`.env.vercel.example`](./.env.vercel.example). Minimal Vercel config: [`vercel.json`](./vercel.json).

**Operator Production go (2026-07-26):** [`docs/ops/production-go-2026-07-26.md`](../../docs/ops/production-go-2026-07-26.md). Cutover gates `owner_go_decision` + `separate_deployment_instruction` are met for greenfield Vercel Production (Stripe deferred). WordPress DNS / retirement is still not authorized.

**Sandbox candidate (this wave):** prepare-only checklist above. Do not migrate Production `005`/`006` or merge `cursor/local-complete-golive-wave` from that section.

**Rules**

- Wave 4 required rows must stay green (item **6** Stripe may stay deferred); unpaid checkout remains the commerce proof.
- Production env vars + Supabase migrate before relying on the Production URL — Wave 5 additive `005`/`006` wait on a later operator instruction.
- Do not run `seed:local` against a Supabase Production database.
- Agents need authenticated Vercel/Supabase access (MCP or CLI) to operate the real projects.

## Preview release preparation (CapRover — transitional)

Historical CapRover offline package prep (no CapRover API call, no push, no deploy):

```bash
npm run prepare:preview
```

When CapRover/preview hosting credentials are absent, a successful offline prepare records `prepared_local` and exits without deploying. **Prefer Vercel Production** ([§ Vercel + Supabase Production](#vercel--supabase-production)). Live CapRover deploy remains outside the default path and is not the primary target.

## Production verification

Browser acceptance belongs to the Vercel Production deployment created by the authorized Production go. A local development server does not replace that verification.

## B2C evidence matrix and cutover plan

The greenfield B2C evidence matrix records **greenfield capability coverage** against a closed checklist (catalog, cart/checkout, orders, auth, support, vendor/admin commerce, Vietnamese search, WordPress import compatibility, quality/preview bar). Row statuses are only `greenfield_proven`, `source_gap`, `evidence_unavailable`, or `deferred_out_of_scope`.

This matrix does **not** claim live WordPress feature parity. Live storefront comparison remains `evidence_unavailable` until an owner supplies approved non-production comparison evidence outside this default path.

The cutover plan lists go/no-go gates (parity evidence packet, quality/preview bar, backup verified, named rollback plan, owner go decision, separate deployment instruction). Recording the plan is not production authorization. Do not deploy, change DNS, switch traffic, or retire WordPress from this path. Non-rebuild cutover/migration tasks stay on hold.

## Identity storage and secrets

The application uses Postgres via `DATABASE_URL` (Compose default and CI use `postgres://sachviet:sachviet@…/sachviet`). CapRover/SQLite `DATABASE_PATH` is transitional only and is no longer the local primary path.

Do not commit `.env` files, credentials, session cookies, password hashes, or database dumps. On the first authorized cloud deployment, configure `AUTH_SESSION_SECRET`, prefer `ADMIN_EMAIL` + `ADMIN_PASSWORD` (plain; hashed at runtime), or fall back to `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD_HASH`, plus `DATABASE_URL` and related secrets through **Vercel Environment Variables** (and Supabase for the database). See [`.env.vercel.example`](./.env.vercel.example) and [`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md). The application creates the first administrator only when those credentials plus `AUTH_SESSION_SECRET` are present and the user store is empty. Setting `ADMIN_*` on Vercel does **not** reset an existing admin password — use account password-change / operator unlock paths after users exist.

When using the hash fallback, generate the password hash with `npm run hash-password` from `app/web` (authorized operations path). Do not place a plain-text password in source control. Do not document or commit hash values.

## Stripe + PayPal sandbox paid path (TASK-PAYMENTS-001)

**Sandbox/test only.** Helpers refuse `sk_live_` and `PAYPAL_MODE=live`. Never commit real keys.

`POST /api/checkout` accepts `{ items, provider?: "stripe" | "paypal" }` (default `stripe`). It creates a pending order, then:

**Stripe** (when configured):

- `STRIPE_SECRET_KEY` (`sk_test_…` only)
- `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL`

Webhook (`POST /api/webhooks/stripe`) requires `STRIPE_WEBHOOK_SECRET`. On `checkout.session.completed` the order becomes `paid` (idempotent) and enqueues `order.paid` confirmation in the same transaction.

**PayPal** (sandbox):

- `PAYPAL_MODE=sandbox`
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`
- `PAYPAL_RETURN_URL` / `PAYPAL_CANCEL_URL`
- `PAYPAL_WEBHOOK_ID` (after Dashboard registration)

Buyer approve → `GET /api/checkout/paypal/return?token=…` captures; webhook `POST /api/webhooks/paypal` is the durable path (`CHECKOUT.ORDER.APPROVED` / `PAYMENT.CAPTURE.COMPLETED`). Verification uses PayPal `verify-webhook-signature` with `PAYPAL_WEBHOOK_ID`.

Cart CTAs: **Thanh toán Stripe** / **Thanh toán PayPal**.

Only failures *before* the paid transition answer `400`. Once the payment is committed the webhook answers `200` even if delivery fails, because the confirmation is already durable; the failed entry stays `pending` with an exponential backoff and is retried by the next drain.

Env names only live in `.env.example` / `.env.docker.example` / `.env.vercel.example`. **Never commit real Stripe or PayPal keys.**

Local test-mode sketch (still not a cloud deploy):

1. Put test/sandbox keys and URLs in `app/.env.docker` (or host `.env`).
2. Forward Stripe webhooks with Stripe CLI to `http://127.0.0.1:3000/api/webhooks/stripe`.
3. Complete Checkout / PayPal sandbox buyer; confirm order status `paid` and a delivery attempt row / log for confirmation email.

## Transactional order email

When an order transitions to `paid`, `dispatchOrderPaidConfirmation` sends a minimal confirmation (Vietnamese/English subject + total) via `resolveEmailTransport`:

- `SMTP_HOST` + `SMTP_FROM` set with an injected submitter → `sent` (counts as delivered).
- `SMTP_HOST` + `SMTP_FROM` set without a submitter → local `recorded` in non-production; **`failed`** in production (`smtp_submitter_unavailable`).
- Unset → recording stub (`recorded`). Missing customer email → `skipped`.

**`recorded` is not delivery.** APIs expose `outcome` separately; `emailed` / outbox `delivered` require `sent`. Recording stubs and missing production submitters leave the outbox pending for retry (or abandon after max attempts).

This path does not require the customer to opt into the email notification channel. Admin integrations status still reflects SMTP credential presence.

### Confirmation outbox

`order_comms_outbox` is the durable record of confirmation work, keyed uniquely by `(order_id, kind)`:

- `pending` — owed. `attempts` and `available_at` advance before each delivery so a crash mid-send retries instead of stalling.
- `delivered` — transport returned `sent`. Replayed webhooks never re-send it. A `recorded` stub does **not** mark delivered.
- `abandoned` — dead letter after 8 attempts, or immediately for a missing/unpaid order. `last_error` holds the reason.

`processOrderCommsOutbox(store, { orderId })` drains due entries and is safe to call repeatedly; the queue, not the webhook result, decides what still needs sending. Inspect stuck comms with:

```sql
SELECT order_id, status, attempts, last_error, available_at FROM order_comms_outbox WHERE status <> 'delivered';
```

Stripe replays drain the queue on their own, but they stop once the webhook is acknowledged. Run the sweep so an entry that failed its last inline attempt is still retried (cron-safe, no arguments):

```bash
DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet node scripts/drain-order-comms-outbox.mjs
```


## Health probe

`GET /api/health` connects to Postgres (`DATABASE_URL`) and runs `SELECT 1`. Compose wires the `web` service healthcheck to this endpoint. A 200 with `{ "ok": true, "db": "ok" }` means the process and database are reachable.

## Catalog for staging vs production

**Staging / local:** use `npm run seed:local` or Compose `--profile seed` (see Seeding above). Safe, idempotent, `@sachviet.test` accounts only.

**Production catalog options (operator choose; do not unlock cutover here):**

1. **Admin day-2 entry (recommended)** — create categories/products/offers via admin catalog APIs/UI after bootstrap (`TASK-ADMIN-002`: `/api/admin/catalog/*` and the catalog section on `/admin`). Prefer this for the first Production catalog load.
2. **Fixture WordPress import** — `importWordpressFixture` remains for REBUILD-021 / local tests only. Production `POST /api/admin/wordpress-import/apply` returns 410. **Not recommended** as the Day-2 Production load path.
3. **Live WP MySQL migration** — still `on_hold` as `TASK-MIGRATION-001` (reconcile unmatched order items / live import). Not part of Phase A default path.

Do not run `seed:local` against a production database.

## Postgres backup and restore

Operator path is `pg_dump` / `pg_restore` (custom format). From `app/web` with client tools on PATH:

```bash
DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet npm run backup:pg
# writes ./backups/sachviet-YYYYMMDD-HHMMSS.dump

DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet npm run restore:pg -- --from ./backups/sachviet-….dump
```

Docker Compose equivalents (from `app/`, stack up):

```bash
mkdir -p web/backups
docker compose exec -T db pg_dump -U sachviet -d sachviet -Fc > web/backups/sachviet-$(date -u +%Y%m%d-%H%M%S).dump
cat web/backups/sachviet-….dump | docker compose exec -T db pg_restore -U sachviet -d sachviet --clean --if-exists --no-owner --no-acl
```

Historical SQLite scripts (`backup-sqlite.mjs` / `restore-sqlite.mjs`) remain only for transitional CapRover/SQLite volumes and are deprecated.

**`backup_verified` is `met`** — drill evidence and operator sign-off: [`docs/ops/backup-restore-drill.md`](../../docs/ops/backup-restore-drill.md). Re-run these scripts for future drills; they do not by themselves authorize production deploy.

### Schema migrations

Versioned additive migrations live in `app/web/migrations/` (`001_initial_schema.sql` plus `registry.mjs`) and apply automatically from `openDatabase` via `schema_migrations`. Run them explicitly with:

```bash
DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet npm run migrate
```

Add new `{ id, up(db) }` entries at the end of `MIGRATIONS` only — never rewrite shipped ids. Dual-owned `CREATE TABLE` definitions were folded into `001_initial_schema`. Current registry includes additive migrations through `007_storage_object_registry` (Storage metadata scaffold; Postgres BYTEA remains the active backend). Production apply of new migrations is operator-gated — see § *Sandbox Production candidate*; do not invent cutovers.

## Operator cloud deploy checklist (Phase A — Production authorized)

Canonical go: [`docs/ops/production-go-2026-07-26.md`](../../docs/ops/production-go-2026-07-26.md). Step-by-step: [`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md). Cutover plan: `docs/tasks/rebuild/TASK-REBUILD-023-…/ship/cutover-plan.md`.

**Platform note:** Target is **Vercel + Supabase**. CapRover/SQLite is transitional / superseded. Operator: **no Preview mode** — Production only. Stripe (steps 3/5 paid path) optional until registered. WP DNS / retirement still blocked.

| Step | Action | Cutover gate |
|---|---|---|
| 1 | Link Vercel to the repo with Root Directory `app/web`, Node **24.x**; deploy **Production** from `main` | `separate_deployment_instruction` (**met**) |
| 2 | Provision Supabase Postgres; set pooler `DATABASE_URL` on Vercel Production; run `npm run migrate` via direct URL | — |
| 3 | Set Vercel **Production** secrets (never in git): `AUTH_SESSION_SECRET`, prefer `ADMIN_EMAIL` + `ADMIN_PASSWORD` (or `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD_HASH`), `AI_SETTINGS_SECRET`, optional `SMTP_*` / Meili/Zalo; **optional** `STRIPE_*` only after Stripe registration | — |
| 4 | Confirm Production HTTPS; auth cookies secure under `NODE_ENV=production` on the deployment | — |
| 5 | **Deferred until Stripe registered:** webhook URL `https://<host>/api/webhooks/stripe` for `checkout.session.completed` | — |
| 6 | Postgres backup/restore drill | `backup_verified` (**met** — see drill doc) |
| 7 | Named rollback (previous Vercel deployment + Supabase PITR / `pg_restore`) | `named_rollback_plan` (**met** — [`docs/ops/named-rollback-plan.md`](../../docs/ops/named-rollback-plan.md)) |
| 8 | Owner recorded **go** (Phase A only; no WP DNS cutover) | `owner_go_decision` (**met** — production-go doc) |
| 9 | Separate explicit operator instruction to Production-deploy | `separate_deployment_instruction` (**met** — production-go doc) |

**Still blocked without a further instruction:** WordPress DNS cutover / WP retirement. Agents need authenticated Vercel/Supabase access to finish cloud execution.

### Operator CapRover deploy checklist (superseded)

Kept for historical CapRover/SQLite hosts. **Do not use for new Preview or Production work** — use Vercel + Supabase above and [`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md).

| Step | Action (CapRover — transitional) | Cutover gate |
|---|---|---|
| 1 | Build/push image from `app/web` (`Dockerfile` / `captain-definition`) to the CapRover app | `separate_deployment_instruction` |
| 2 | Provision Postgres (`DATABASE_URL`). CapRover/SQLite volume is transitional only. | — |
| 3 | Set CapRover secrets (same names as Vercel table above) | — |
| 4 | Configure CapRover TLS / HTTPS | — |
| 5–9 | Stripe webhook, backup drill, named rollback (previous CapRover image + volume), owner go, separate deploy instruction | same gates as cloud table |

Live CapRover deploy still requires an explicit operator instruction and is not the primary path.
