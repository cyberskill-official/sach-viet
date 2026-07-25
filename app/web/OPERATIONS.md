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

`captain-definition` selects this Dockerfile for a CapRover preview package. Do not deploy it without an explicit operator instruction.

### Local Docker (production-like)

Use Compose under `app/` to run the same production image locally with a persisted SQLite volume. This is **not** a CapRover deploy and is **not** a hot-reload / `next dev` stack.

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
docker compose ps   # wait until web is healthy (port 127.0.0.1:3000)
```

Foreground (`docker compose up --build` without `-d`) also works if you want live logs in the terminal.

5. Open `http://127.0.0.1:3000`. First login at `/login` with the bootstrap email and password creates the first admin when the user store is empty. After seeding (next section), prefer the seeded `admin.seed@sachviet.test` account for walkthroughs.

6. Tear down (from `app/`):

```bash
docker compose down
```

Add `-v` only if you intend to reset the SQLite volume (`sachviet-data`).

When SMTP, Zalo, Stripe webhook, or Meili env vars are unset, those integrations use recording stubs / local defaults. Compose always sets `DATABASE_PATH` to `/data/sachviet.sqlite` on the named volume.

**Password hash `$` escaping (required):** scrypt hashes contain `$`. Docker Compose interpolates values from `app/.env.docker` (`env_file`). Escape every `$` as `$$` when pasting the hash (e.g. `scrypt$salt$digest` → `scrypt$$salt$$digest`). At runtime the container receives single `$` (verified with Compose v5). The same `$$` rule applies if you ever inline a hash under a service `environment:` key.

### Seeding local demo data

`app/web/scripts/seed-local.mjs` fills the SQLite database with a walkthrough dataset: three categories, ten Vietnamese book products (one deliberately out of stock), competing vendor offers, two vendors, two customers, one paid and one pending order, one vendor payout, one pending vendor application, notifications, a review, and a support ticket. It is **local development material only** and must never run against a deployed database.

The seed is idempotent. Catalog rows are upserted; orders, payouts, applications, notifications, and support records are created only when the seeded user has none. It also runs the first-admin bootstrap before creating any seed user, so an operator-configured `BOOTSTRAP_ADMIN_EMAIL` account is still created rather than blocked by the seed data.

**Against the Docker volume** (recommended; run from `app/` with the stack already up):

```bash
docker compose --profile seed run --rm seed
```

The `seed` service is a one-shot `node:24-alpine` container that mounts the same `sachviet-data` volume plus a read-only copy of `web/scripts` and `web/src/lib`. It never starts with `docker compose up`.

To choose the account password instead of accepting a generated one:

```bash
SEED_PASSWORD='<local-only-password>' docker compose --profile seed run --rm -e SEED_PASSWORD seed
```

**Against a host database** (for example when running `next dev` outside Docker), from `app/web`:

```bash
DATABASE_PATH=./data/sachviet.sqlite npm run seed:local
```

The script prints the seeded accounts and the password used. Every seeded account shares that one password, and re-running the seed resets all seeded accounts to the current password. Do not record the value in this file, in `.env` files, or in commits.

Seeded accounts (`admin`, two `vendor`, two `customer`) all use the `@sachviet.test` reserved domain so they cannot collide with real addresses.

To reset to a clean database, tear down with `docker compose down -v`, bring the stack back up, and seed again.

### Local end-to-end smoke

Verified path (from `app/`, stack healthy + seeded). Replace `<seed password>` with the value printed by the seed run (or the `SEED_PASSWORD` you passed).

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

## Preview release preparation

Prepare and validate a CapRover preview package offline (no CapRover API call, no push, no deploy):

```bash
npm run prepare:preview
```

When CapRover/preview hosting credentials are absent, a successful offline prepare records `prepared_local` and exits without deploying. Production targets and unauthorized remote publish attempts are refused. Live CapRover deploy remains an operator-authorized step outside the default path.

## Preview verification

Browser acceptance belongs to the preview deployment created by an authorized release step. A local development server does not replace that verification.

## B2C evidence matrix and cutover plan

The greenfield B2C evidence matrix records **greenfield capability coverage** against a closed checklist (catalog, cart/checkout, orders, auth, support, vendor/admin commerce, Vietnamese search, WordPress import compatibility, quality/preview bar). Row statuses are only `greenfield_proven`, `source_gap`, `evidence_unavailable`, or `deferred_out_of_scope`.

This matrix does **not** claim live WordPress feature parity. Live storefront comparison remains `evidence_unavailable` until an owner supplies approved non-production comparison evidence outside this default path.

The cutover plan lists go/no-go gates (parity evidence packet, quality/preview bar, backup verified, named rollback plan, owner go decision, separate deployment instruction). Recording the plan is not production authorization. Do not deploy, change DNS, switch traffic, or retire WordPress from this path. Non-rebuild cutover/migration tasks stay on hold.

## Identity storage and secrets

The application stores its SQLite database at `DATABASE_PATH`, which defaults to `/data/sachviet.sqlite`. Keep that directory on persistent storage in any authorized deployment.

Do not commit `.env` files, credentials, session cookies, password hashes, or database files. On the first authorized deployment, configure `AUTH_SESSION_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD_HASH` through the platform secret settings. The application creates the first administrator only when all three are present and the user store is empty.

Generate the password hash with `npm run hash-password` from `app/web` (authorized operations path). Do not place a plain-text password in configuration or source control. Do not document or commit hash values.

## Stripe paid path (code readiness)

Checkout (`POST /api/checkout`) creates a pending order, then a Stripe Checkout Session when all of these are set:

- `STRIPE_SECRET_KEY` (use `sk_test_…` locally; live key only via CapRover secrets)
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

Webhook (`POST /api/webhooks/stripe`) requires `STRIPE_WEBHOOK_SECRET` and a valid `Stripe-Signature` header. On `checkout.session.completed` the order becomes `paid` (idempotent) and, in the same transaction, a confirmation row is queued in `order_comms_outbox`. The request then drains that queue, which sends order-confirmation email (SMTP or recording stub) plus an in-app `order.paid` notification.

Only failures *before* the paid transition answer `400`. Once the payment is committed the webhook answers `200` even if delivery fails, because the confirmation is already durable; the failed entry stays `pending` with an exponential backoff and is retried by the next drain.

Env names only live in `.env.example` / `.env.docker.example`. **Never commit real Stripe keys.** Operator must supply CapRover (or local) secrets before a real paid path works.

Local test-mode sketch (still not a CapRover deploy):

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
DATABASE_PATH=/data/sachviet.sqlite node scripts/drain-order-comms-outbox.mjs
```


## Health probe

`GET /api/health` opens SQLite and runs `SELECT 1`. Compose wires the `web` service healthcheck to this endpoint. A 200 with `{ "ok": true, "db": "ok" }` means the process and database file are reachable.

## Catalog for staging vs production

**Staging / local:** use `npm run seed:local` or Compose `--profile seed` (see Seeding above). Safe, idempotent, `@sachviet.test` accounts only.

**Production catalog options (operator choose; do not unlock cutover here):**

1. **Fixture WordPress import** — admin `wordpress-import` apply against an approved fixture JSON (greenfield compatibility already proven). Suitable for a controlled catalog load without live MySQL.
2. **Live WP MySQL migration** — still `on_hold` as `TASK-MIGRATION-001` (reconcile unmatched order items / live import). Not part of Phase A default path.
3. **Admin day-2 entry** — create categories/products/offers via admin commerce APIs/UI after bootstrap.

Do not run `seed:local` against a production database.

## SQLite backup and restore

Practical backup/restore lives under `app/web/scripts/`. The backup opens the live DB, runs `PRAGMA wal_checkpoint(TRUNCATE)`, then copies the main database file. Restore copies a backup over `DATABASE_PATH` (after a safety copy) and probes `SELECT 1`.

**Backup** (from `app/web`, or against the Compose volume with the stack stopped or briefly quiescent):

```bash
DATABASE_PATH=/data/sachviet.sqlite node scripts/backup-sqlite.mjs
# or
DATABASE_PATH=/path/to/sachviet.sqlite node scripts/backup-sqlite.mjs --out ./backups/sachviet-manual.sqlite
```

**Restore** (stop the web process first so writers are idle):

```bash
DATABASE_PATH=/data/sachviet.sqlite node scripts/restore-sqlite.mjs --from ./backups/sachviet-manual.sqlite
```

### Restore drill (operator evidence)

The cutover gate `backup_verified` stays **unmet** until an operator records a successful drill. Suggested evidence path (create when you run the drill; do not invent a completed artefact):

`docs/tasks/rebuild/TASK-REBUILD-023-b2c-parity-cutover-readiness/ship/backup-restore-drill.md`

Minimum drill contents: timestamp, source DB path, backup file path + size, restore target, `SELECT 1` / login smoke result, operator initials. Completing the scripts alone does **not** satisfy `backup_verified`.

### Schema migrations

Versioned additive migrations live in `app/web/migrations/registry.mjs` and apply automatically from `openSqliteDatabase` via `schema_migrations`. Add new `{ id, up(db) }` entries at the end of `MIGRATIONS` only — never rewrite shipped ids.

**Follow-up (not done in this foundation):** move dual-owned `CREATE TABLE IF NOT EXISTS` definitions (`orders`, notification tables, `royalty_decision_acceptances`) into numbered migrations and thin the per-module ensure helpers.

## Health probe

`GET /api/health` opens SQLite and runs `SELECT 1`. Compose wires the `web` service healthcheck to this endpoint. A 200 with `{ "ok": true, "db": "ok" }` means the process and database file are reachable.

## Catalog for staging vs production

**Staging / local:** use `npm run seed:local` or Compose `--profile seed` (see Seeding above). Safe, idempotent, `@sachviet.test` accounts only.

**Production catalog options (operator choose; do not unlock cutover here):**

1. **Fixture WordPress import** — admin `wordpress-import` apply against an approved fixture JSON (greenfield compatibility already proven). Suitable for a controlled catalog load without live MySQL.
2. **Live WP MySQL migration** — still `on_hold` as `TASK-MIGRATION-001` (reconcile unmatched order items / live import). Not part of Phase A default path.
3. **Admin day-2 entry** — create categories/products/offers via admin commerce APIs/UI after bootstrap.

Do not run `seed:local` against a production database.

## Operator CapRover deploy checklist (Phase A — do not execute from this path)

This checklist is an artefact for an authorized operator. Completing the list does **not** authorize deploy. Map each item to unmet cutover gates in `docs/tasks/rebuild/TASK-REBUILD-023-…/ship/cutover-plan.md`.

| Step | Action | Cutover gate |
|---|---|---|
| 1 | Build/push image from `app/web` (`Dockerfile` / `captain-definition`) to the CapRover app | `separate_deployment_instruction` |
| 2 | Attach persistent volume for `DATABASE_PATH` (default `/data/sachviet.sqlite`) | — |
| 3 | Set secrets (never in git): `AUTH_SESSION_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD_HASH`, `STRIPE_SECRET_KEY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, `STRIPE_WEBHOOK_SECRET`, optional `SMTP_*`, optional Meili/Zalo | — |
| 4 | Configure CapRover TLS / HTTPS; confirm auth cookies are secure under `NODE_ENV=production` | — |
| 5 | Register Stripe webhook URL `https://<prod-host>/api/webhooks/stripe` for `checkout.session.completed` | — |
| 6 | Verify SQLite (+ media if any) **backup** and restore drill | `backup_verified` |
| 7 | Document **named rollback** (previous CapRover image + volume restore) | `named_rollback_plan` |
| 8 | Owner recorded **go / no-go** (Phase A only; no WP DNS cutover) | `owner_go_decision` |
| 9 | Separate explicit operator instruction to deploy (this document alone is insufficient) | `separate_deployment_instruction` |

Unmet gates that still block owner go for WP retirement: `backup_verified`, `named_rollback_plan`, `owner_go_decision`, `separate_deployment_instruction`. Phase A can run as a **parallel** greenfield store without DNS/WP retirement once the operator authorizes deploy separately.

**Do not** push, deploy, merge CapRover, or change DNS from agent automation without that explicit instruction.
