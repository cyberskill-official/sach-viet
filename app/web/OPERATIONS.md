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

Build the production image without starting an application process:

```bash
docker build --tag sachviet-web-foundation:local .
```

`captain-definition` selects this Dockerfile for a CapRover preview package. Do not deploy it without an explicit operator instruction.

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

Generate the password hash through the authorized operations path. Do not place a plain-text password in configuration or source control.
