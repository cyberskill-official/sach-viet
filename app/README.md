# SachViet application workspace

`web/` is the single full-stack Next.js application for the greenfield rebuild. A separate API package is deliberately absent.

Use the package checks in `web/OPERATIONS.md`. Production packaging is defined by `web/Dockerfile` and `web/captain-definition`.

For a production-like local run (Compose, port 3000, **Postgres**, bootstrap admin), see **Local Docker (production-like)** in `web/OPERATIONS.md`. Verified path from `app/`:

```bash
cp .env.docker.example .env.docker   # first time only; fill AUTH_* / BOOTSTRAP_* (escape `$` in hashes as `$$`)
docker compose up -d --build
docker compose --profile seed run --rm seed
```

Open `http://127.0.0.1:3000`. Details, smoke checks, Stripe/SMTP limits, and teardown: `web/OPERATIONS.md`.
