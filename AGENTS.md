# AGENTS.md

This repository runs **CyberOS**. Canonical agent instructions: `.cyberos/AGENT-ENTRY.md`.

Work is tasks; HITL is required at the two human-acceptance gates; run gates with `bash .cyberos/cuo/gates/run-gates.sh`. Never push, deploy, or merge without an explicit operator instruction.

Memory (BRAIN): protocol at `.cyberos/memory/AGENTS.md`; store at `.cyberos/memory/store/`.

<!-- cyberos-agent-spine (managed by cyberos install; edit above/below this marker) -->

## Cursor Cloud specific instructions

The app lives in `app/web` (Next.js 16 / React 19 / Postgres). Standard commands live in `README.md`, `app/web/package.json`, and `app/web/OPERATIONS.md` — reference those rather than re-deriving them. Notes below are the non-obvious cloud gotchas.

- Node: the codebase requires Node 24 (`engines.node = 24.x`). The startup update script installs it via nvm, but the exec-daemon ships a Node 22 binary at `/exec-daemon/node` that sits **ahead of nvm in `PATH`**. In any shell/terminal you must run `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24` (or prepend `$HOME/.nvm/versions/node/v24.*/bin` to `PATH`) before `node`/`npm`, otherwise you silently get Node 22.

- Postgres is required for `migrate`, `test`, `verify`, and `dev`. It is intentionally **not** installed or started by the update script (system dependency + service startup). Bring it up once per VM: `sudo apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql`, set the cluster port to `54329` (`sudo sed -i "s/^#\?port = .*/port = 54329/" /etc/postgresql/16/main/postgresql.conf`), start it with `sudo pg_ctlcluster 16 main start` (systemd is not running, so use `pg_ctlcluster`, not `service`/`systemctl`), then create the role/db: `CREATE ROLE sachviet LOGIN PASSWORD 'sachviet';` and `createdb -O sachviet sachviet`. Port `54329` matches the app default `DATABASE_URL` (`postgres://sachviet:sachviet@127.0.0.1:54329/sachviet`), so no env var is needed once it is running. Docker is not available in this VM, so the `app/docker-compose.yml` Postgres path does not apply — run Postgres natively.

- Dev/runtime env: create `app/web/.env.local` (gitignored) with at least `AUTH_SESSION_SECRET` (≥32 chars); Next.js loads it automatically for `npm run dev`. `openDatabase` auto-applies migrations on first connect for local (non-Vercel) runs.

- Demo data + auth caveat: login rejects **unverified** accounts, so a freshly registered user cannot log in until email verification (email uses recording stubs locally). Use `SEED_PASSWORD='<pw>' npm run seed:local` to create verified demo accounts across every role (e.g. customer `khach-hang.seed@sachviet.test`, admin `admin.seed@sachviet.test`) plus a 10-book catalog for end-to-end testing.

- The full test suite (`npm test`) is large (~300 tests, several minutes) and requires a live Postgres.

- Browser testing must use `http://localhost:3000`, **not** `http://127.0.0.1:3000`. Next.js 16 blocks cross-origin dev resources (`/_next/*`) when the browser origin is not an allowed dev origin, and `127.0.0.1` is not the dev server's own origin. Loading `next dev` over `127.0.0.1` leaves the server-rendered shell visible but silently prevents client hydration, so client-fetched pages (e.g. `/products/[slug]`, catalog) render a blank/skeleton area even though the underlying APIs return 200. Server-side `curl` smokes are unaffected; only the browser origin matters.
