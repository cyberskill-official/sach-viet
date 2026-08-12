# SachViet

SachViet is a private greenfield rebuild of a Vietnamese-book marketplace for retail customers, institutions, vendors, authors, and publishers.

## Current repository truth

- The active application is `app/web`: Next.js 16, React 19, TypeScript, and **Postgres** (local Docker + CI; Vercel + Supabase is the production target). CapRover/SQLite is transitional only.
- The live WordPress store and any production environment are outside this repository's verified state. This README does not claim real-commerce readiness or WordPress DNS cutover.
- Current scope, deferrals, and readiness: `docs/07-status-roadmap.md`.
- Local, container, preview-preparation, and deployment-safety guidance: `app/web/OPERATIONS.md`.
- **Docker acceptance gate (Wave 4):** `docs/docker-acceptance-gate.md`. Greenfield Vercel Production was authorized 2026-07-26; Preview is abandoned. WP DNS still needs a separate cutover instruction. This audit follow-up does not deploy Production.
- **Vercel + Supabase wiring:** `docs/deploy-vercel-supabase.md`. CapRover is transitional.
- Historical handoff documents `docs/01-vision.md` through `docs/06-tech-stack.md` are archived context. Their Nuxt/Laravel topology and production claims are not the current implementation.

## Development

Use Node.js 24 and run from `app/web`. Tests and migrate expect Postgres (`DATABASE_URL`; Compose publishes `127.0.0.1:54329`):

```bash
# From app/: docker compose up -d db   # or use CI service / local Postgres
cd app/web
npm ci
export DATABASE_URL=postgres://sachviet:sachviet@127.0.0.1:54329/sachviet
npm run migrate
npm run lint
npm test
npm run verify
npm run build
```

Local production-like stack (Postgres + web + optional seed): see `app/web/OPERATIONS.md` § Local Docker.

GitHub Actions runs the same checks on pushes and pull requests (with a Postgres service). It does not deploy.

## Governance and licensing

CyberOS machine gates are necessary but do not replace the two required human acceptance verdicts. See `docs/governance/hitl-policy.md`.

This repository is private and proprietary; see `LICENSE`. The `@cyberskill/design` dependency is UNLICENSED/internal and is not granted for redistribution by this repository's license.
