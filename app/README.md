# SachViet application workspace

`web/` is the single full-stack Next.js application for the greenfield rebuild. A separate API package is deliberately absent.

Use the package checks in `web/OPERATIONS.md`. Production packaging is defined by `web/Dockerfile` and `web/captain-definition`.

For a production-like local run (Compose, port 3000, SQLite volume, bootstrap admin), see **Local Docker (production-like)** in `web/OPERATIONS.md`. Copy `app/.env.docker.example` → `app/.env.docker`, then from `app/`: `docker compose up --build`.

To fill that local database with walkthrough data, run `docker compose --profile seed run --rm seed` from `app/`. See **Seeding local demo data** in `web/OPERATIONS.md`.
