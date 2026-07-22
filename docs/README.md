# SachViet Web — Team Handoff Package

Onboarding documentation for the team taking over development of the **SachViet platform** (Nuxt frontend `app/web` + Laravel API `app/api`).

**Prepared:** 2026-07-11 · **Owner:** Austin Nguyen (austinnguyen89@gmail.com)

## Reading order

| Doc | What it answers |
|---|---|
| [01-vision.md](01-vision.md) | What is SachViet? Why does it exist? Where is it going? |
| [02-architecture.md](02-architecture.md) | Infra map, repo structure tree, data flow, environments |
| [03-portals.md](03-portals.md) | The 9 user portals — what each does, what's real vs mocked, what's needed |
| [04-roles-permissions.md](04-roles-permissions.md) | Role tree, route-guard matrix (frontend + API) |
| [05-data-model.md](05-data-model.md) | Entities grouped by business domain |
| [06-tech-stack.md](06-tech-stack.md) | Current stack + recommendations — **open for discussion** |
| [07-status-roadmap.md](07-status-roadmap.md) | What's done, what's left, known issues, blockers |

## Ground rules (non-negotiable project conventions)

1. **Never run the app locally.** Workflow: code → self-review (typecheck/lint/tests) → push to GitHub (private) → deploy to CapRover preview → verify on the real URL.
2. **All GitHub repos are private.** No exceptions without explicit owner instruction.
3. **Never commit secrets.** All credentials live in `app/local/credentials/` (gitignored) and CapRover env vars.
4. **Backup before any destructive operation** (delete/overwrite of files, data, listings).
5. Deliverables, code comments, commit messages: **English**.

## Deeper references inside the repo

- `app/misc/docs/project_full_map.md` — file-by-file map of every page, component, model, controller (Apr 2026)
- `app/docs/architecture.md` — original architecture doc
- `app/TODO.md` — living master TODO (per-item status)
- `app/misc/TEST_ACCOUNTS*` — test logins for every role
- Root `README.md` — the full workspace (scraper, pricing tools, order tracker satellites)
