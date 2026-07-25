# Operations

This package is the SachViet greenfield Next.js foundation. It includes local identity storage and session handling, but has no external identity provider, credentials, or business endpoints.

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

`captain-definition` selects this Dockerfile for a **transitional** CapRover package. Prefer Vercel + Supabase for cloud preview ([`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md)). Do not deploy CapRover or Vercel without an explicit operator instruction.

### Local Docker (production-like)

Use Compose under `app/` to run the same production image locally against **Postgres** (not SQLite). This matches the Vercel + Supabase target shape. CapRover/SQLite remains transitional only. This is **not** a CapRover deploy and is **not** a hot-reload / `next dev` stack.

**Prerequisites:** Docker Desktop or Engine with Compose.

1. Copy the env template and fill secrets (do not commit the real file):

```bash
cp app/.env.docker.example app/.env.docker
```

2. Set `AUTH_SESSION_SECRET` (at least 32 characters), for example:

```bash
openssl rand -hex 32
```

3. Set `BOOTSTRAP_ADMIN_EMAIL`, then generate `BOOTSTRAP_ADMIN_PASSWORD_HASH` from `app/web` (prints one hash line; paste into `app/.env.docker` — never commit hash values or document sample hashes here). Prefer stdin so the password is not stored in shell history:

```bash
cd app/web
printf '%s' 'your-password' | npm run hash-password
```

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

### Admin BYOK AI (Wave 3)

Admin-only settings + playground live on `/admin` (AI panel). Not a customer feature.

1. Set `AI_SETTINGS_SECRET` in `app/.env.docker` (min 32 characters), e.g. `openssl rand -hex 32`, then recreate the web container so the env is picked up.
2. Sign in as admin → open `/admin` → **AI BYOK** panel.
3. Prefer a free OpenAI-compatible endpoint:
   - **OpenRouter free:** base `https://openrouter.ai/api/v1`, model e.g. `meta-llama/llama-3.2-3b-instruct:free`
   - **Groq:** base `https://api.groq.com/openai/v1`, model e.g. `llama-3.1-8b-instant`
   - **Ollama (local):** base `http://host.docker.internal:11434/v1`, model e.g. `llama3.2` (API key can be any non-empty placeholder)
4. Paste the provider API key → **Save settings** → send a short playground message.

API: `GET/PUT /api/admin/ai-settings`, `POST /api/admin/ai/chat` (admin session cookie required). Keys are AES-256-GCM encrypted at rest; responses never include the raw key. Chat **fails closed** with HTTP 400 when the secret or key is unset, or HTTP 502 with a clear provider error body when the upstream call fails.

Smoke (after save): playground UI should show an assistant reply, or an explicit error such as `AI API key is not configured` / `AI_SETTINGS_SECRET is required` / `AI provider error: …` — never a bare 500.

**Password hash `$` escaping (required):** scrypt hashes contain `$`. Docker Compose interpolates values from `app/.env.docker` (`env_file`). Escape every `$` as `$$` when pasting the hash (e.g. `scrypt$salt$digest` → `scrypt$$salt$$digest`). At runtime the container receives single `$` (verified with Compose v5). The same `$$` rule applies if you ever inline a hash under a service `environment:` key.

### Seeding local demo data

`app/web/scripts/seed-local.mjs` fills Postgres with a walkthrough dataset: three categories, ten Vietnamese book products (one deliberately out of stock), competing vendor offers, two vendors, two customers, one paid and one pending order, one vendor payout, one pending vendor application, notifications, a review, and a support ticket. It is **local development material only** and must never run against a deployed database. The script **refuses** when `NODE_ENV=production`.

The seed is idempotent. Catalog rows are upserted; orders, payouts, applications, notifications, and support records are created only when the seeded user has none. It also runs the first-admin bootstrap before creating any seed user, so an operator-configured `BOOTSTRAP_ADMIN_EMAIL` account is still created rather than blocked by the seed data.

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

Expected local limits:

- **Checkout stops at Stripe when secrets are unset.** `POST /api/checkout` **creates the pending order first**, then returns `400` with `Stripe checkout is not configured.` when `STRIPE_SECRET_KEY`, `STRIPE_SUCCESS_URL`, or `STRIPE_CANCEL_URL` is unset. Confirm via `GET /api/orders` (`pending_payment`). With test-mode secrets in `app/.env.docker` (never commit) + Stripe CLI webhook forwarding, restart the stack and complete a session to reach `paid` and trigger confirmation email (SMTP or recording stub).
- **Email, Zalo, Meilisearch, and WordPress import** stay on recording stubs / local defaults when their env vars are unset, so the WordPress import panel reports `fixture · none` with no runs.
- Only the admin portal has a populated dashboard. Other portals render the shared shell with an empty table or the pending-policy notice.

## Docker acceptance checklist (Wave 4)

Tracked gate before any cloud deploy. Short pointer: [`docs/docker-acceptance-gate.md`](../../docs/docker-acceptance-gate.md).

**Hard rules**

- **Vercel production deploy is forbidden** until every row below is green with evidence.
- **Vercel preview** may start only after local items **1–7** pass.
- Wave 5 preview wiring ([`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md)) does not authorize production or DNS cutover; that still needs an explicit operator instruction.
- CapRover/SQLite remains transitional only and is not an escape hatch around this gate.

**Automated smoke** (stack up + seeded; from `app/web`):

```bash
npm run smoke:docker
# optional: SEED_PASSWORD='…' BASE_URL=http://127.0.0.1:3000 npm run smoke:docker
```

`smoke:docker` covers items 1, 3–5, and fail-closed AI settings/chat (7). It prints MANUAL steps for 2, 6, real-key playground (7), 8, and 9. It never marks `backup_verified` met.

| # | Check | How | Evidence / status |
|---|---|---|---|
| 1 | Compose healthy; `/api/health` → Postgres OK | `docker compose up -d --build` from `app/`; `curl -s http://127.0.0.1:3000/api/health` → `{"ok":true,"db":"ok"}`; also `npm run smoke:docker` | _operator_ |
| 2 | Seed idempotent; no default password stdout leak | `SEED_PASSWORD=… docker compose --profile seed run --rm seed` twice; confirm password not printed (file `.seed-password` or env only) | _operator_ |
| 3 | Login admin + customer | Seeded `admin.seed@sachviet.test` + `khach-hang.seed@sachviet.test`; smoke automates | _operator_ |
| 4 | Catalog search + suggestions | `q=hoang tu be` ranks Hoàng Tử Bé; `/api/catalog/search/suggestions?q=hoang`; smoke automates | _operator_ |
| 5 | Cart → checkout pending path | Customer checkout without Stripe secrets → pending order + `Stripe checkout is not configured.`; smoke automates | _operator_ |
| 6 | Stripe webhook → outbox path | **Manual / CLI:** Stripe test keys + CLI forward to `/api/webhooks/stripe`, complete Checkout → `paid` + `order_comms_outbox`; **stub:** after a paid transition, `DATABASE_URL=… node scripts/drain-order-comms-outbox.mjs` | _operator_ |
| 7 | Admin AI BYOK playground | `/admin` AI panel with free-model key → non-500 reply; smoke checks settings + fail-closed chat without key | _operator_ |
| 8 | Postgres backup/restore drill | Follow § Postgres backup and restore; record in [`docs/ops/backup-restore-drill.md`](../../docs/ops/backup-restore-drill.md). **`backup_verified` stays unmet until that file is filled** | unmet — see drill doc |
| 9 | `npm run quality` + CI green | From `app/web` with `DATABASE_URL` set: `npm run quality`; confirm GitHub Actions Postgres CI green on the branch | _operator_ |

Do not check off rows from agent automation alone. Recording evidence here or in the drill doc is not production authorization.

## Vercel + Supabase preview (Wave 5)

**Primary cloud target:** Vercel (`app/web`) + Supabase (Postgres). CapRover is transitional / superseded for new preview work.

Full operator steps (create project, pooler `DATABASE_URL`, migrations, Vercel Root Directory, env names, preview vs production rules): [`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md). Env name template: [`.env.vercel.example`](./.env.vercel.example). Minimal Vercel config: [`vercel.json`](./vercel.json).

**Rules (unchanged from Wave 4 gate)**

- Preview on Vercel only after Docker acceptance items **1–7** pass locally.
- Production on Vercel is **forbidden** until the full Wave 4 checklist is green **and** an explicit operator instruction authorizes it.
- Do not run `vercel deploy` or Supabase cloud CLI against real projects from agent automation without that instruction.
- Never run `seed:local` against a Supabase Preview/Production database.

## Preview release preparation (CapRover — transitional)

Historical CapRover offline package prep (no CapRover API call, no push, no deploy):

```bash
npm run prepare:preview
```

When CapRover/preview hosting credentials are absent, a successful offline prepare records `prepared_local` and exits without deploying. Production targets and unauthorized remote publish attempts are refused. **Prefer Vercel Preview** ([§ Vercel + Supabase preview](#vercel--supabase-preview-wave-5)). Live CapRover deploy remains an operator-authorized step outside the default path and is not the primary target.

## Preview verification

Browser acceptance belongs to the preview deployment created by an authorized release step (Vercel Preview preferred). A local development server does not replace that verification.

## B2C evidence matrix and cutover plan

The greenfield B2C evidence matrix records **greenfield capability coverage** against a closed checklist (catalog, cart/checkout, orders, auth, support, vendor/admin commerce, Vietnamese search, WordPress import compatibility, quality/preview bar). Row statuses are only `greenfield_proven`, `source_gap`, `evidence_unavailable`, or `deferred_out_of_scope`.

This matrix does **not** claim live WordPress feature parity. Live storefront comparison remains `evidence_unavailable` until an owner supplies approved non-production comparison evidence outside this default path.

The cutover plan lists go/no-go gates (parity evidence packet, quality/preview bar, backup verified, named rollback plan, owner go decision, separate deployment instruction). Recording the plan is not production authorization. Do not deploy, change DNS, switch traffic, or retire WordPress from this path. Non-rebuild cutover/migration tasks stay on hold.

## Identity storage and secrets

The application uses Postgres via `DATABASE_URL` (Compose default and CI use `postgres://sachviet:sachviet@…/sachviet`). CapRover/SQLite `DATABASE_PATH` is transitional only and is no longer the local primary path.

Do not commit `.env` files, credentials, session cookies, password hashes, or database dumps. On the first authorized cloud deployment, configure `AUTH_SESSION_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD_HASH`, `DATABASE_URL`, and related secrets through **Vercel Environment Variables** (and Supabase for the database). See [`.env.vercel.example`](./.env.vercel.example) and [`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md). The application creates the first administrator only when the bootstrap trio is present and the user store is empty.

Generate the password hash with `npm run hash-password` from `app/web` (authorized operations path). Do not place a plain-text password in configuration or source control. Do not document or commit hash values.

## Stripe paid path (code readiness)

Checkout (`POST /api/checkout`) creates a pending order, then a Stripe Checkout Session when all of these are set:

- `STRIPE_SECRET_KEY` (use `sk_test_…` locally and on Vercel Preview; live key only via authorized Production secrets)
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

Webhook (`POST /api/webhooks/stripe`) requires `STRIPE_WEBHOOK_SECRET` and a valid `Stripe-Signature` header. On `checkout.session.completed` the order becomes `paid` (idempotent) and, in the same transaction, a confirmation row is queued in `order_comms_outbox`. The request then drains that queue, which sends order-confirmation email (SMTP or recording stub) plus an in-app `order.paid` notification.

Only failures *before* the paid transition answer `400`. Once the payment is committed the webhook answers `200` even if delivery fails, because the confirmation is already durable; the failed entry stays `pending` with an exponential backoff and is retried by the next drain.

Env names only live in `.env.example` / `.env.docker.example` / `.env.vercel.example`. **Never commit real Stripe keys.** Operator must supply Vercel (or local Compose) secrets before a real paid path works.

Local test-mode sketch (still not a cloud deploy):

1. Put test keys and URLs in `app/.env.docker` (or host `.env`).
2. Forward webhooks with Stripe CLI to `http://127.0.0.1:3000/api/webhooks/stripe`.
3. Complete a Checkout Session; confirm order status `paid` and a delivery attempt row / log for confirmation email.

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

1. **Fixture WordPress import** — admin `wordpress-import` apply against an approved fixture JSON (greenfield compatibility already proven). Suitable for a controlled catalog load without live MySQL.
2. **Live WP MySQL migration** — still `on_hold` as `TASK-MIGRATION-001` (reconcile unmatched order items / live import). Not part of Phase A default path.
3. **Admin day-2 entry** — create categories/products/offers via admin commerce APIs/UI after bootstrap.

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

**`backup_verified` stays unmet** until an operator records a successful restore drill in [`docs/ops/backup-restore-drill.md`](../../docs/ops/backup-restore-drill.md) (and mirrors the gate in the B2C cutover plan). These scripts never flip that cutover gate.

### Schema migrations

Versioned additive migrations live in `app/web/migrations/` (`001_initial_schema.sql` plus `registry.mjs`) and apply automatically from `openDatabase` via `schema_migrations`. Run them explicitly with:

```bash
DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet npm run migrate
```

Add new `{ id, up(db) }` entries at the end of `MIGRATIONS` only — never rewrite shipped ids. Dual-owned `CREATE TABLE` definitions were folded into `001_initial_schema`.

## Operator cloud deploy checklist (Phase A — do not execute from this path)

This checklist is an artefact for an authorized operator. Completing the list does **not** authorize deploy. Map each item to unmet cutover gates in `docs/tasks/rebuild/TASK-REBUILD-023-…/ship/cutover-plan.md`. Step-by-step Preview wiring: [`docs/deploy-vercel-supabase.md`](../../docs/deploy-vercel-supabase.md).

**Platform note:** The production target is **Vercel + Supabase**. CapRover/SQLite is transitional / superseded for new work. **Vercel production deploy is forbidden** until the [Docker acceptance checklist (Wave 4)](#docker-acceptance-checklist-wave-4) is 100% green. Preview on Vercel may start only after local items 1–7 pass.

| Step | Action | Cutover gate |
|---|---|---|
| 1 | Link Vercel to the repo with Root Directory `app/web`; Preview deploy only (see Wave 5 doc). Do not Production-promote. | `separate_deployment_instruction` |
| 2 | Provision Supabase Postgres; set pooler `DATABASE_URL` on Vercel; run `npm run migrate` via direct URL | — |
| 3 | Set Vercel secrets (never in git): `AUTH_SESSION_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD_HASH`, `STRIPE_SECRET_KEY` (test on Preview), `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, `STRIPE_WEBHOOK_SECRET`, `AI_SETTINGS_SECRET`, optional `SMTP_*`, optional Meili/Zalo | — |
| 4 | Confirm Preview HTTPS; auth cookies secure under `NODE_ENV=production` on the deployment | — |
| 5 | Register Stripe webhook URL `https://<preview-or-prod-host>/api/webhooks/stripe` for `checkout.session.completed` (test mode on Preview) | — |
| 6 | Verify Postgres **backup** and restore drill (Supabase +/or `pg_dump` / Wave 2) | `backup_verified` |
| 7 | Document **named rollback** (previous Vercel deployment + Supabase restore / PITR) | `named_rollback_plan` |
| 8 | Owner recorded **go / no-go** (Phase A only; no WP DNS cutover) | `owner_go_decision` |
| 9 | Separate explicit operator instruction to Production-deploy (this document alone is insufficient) | `separate_deployment_instruction` |

Unmet gates that still block owner go for WP retirement: `backup_verified`, `named_rollback_plan`, `owner_go_decision`, `separate_deployment_instruction`. Phase A can run as a **parallel** greenfield store without DNS/WP retirement once the operator authorizes deploy separately.

**Do not** push, deploy, merge, promote Production on Vercel, or change DNS from agent automation without that explicit instruction.

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
