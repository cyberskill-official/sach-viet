# SachViet

SachViet is a private greenfield rebuild of a Vietnamese-book marketplace for retail customers, institutions, vendors, authors, and publishers.

## Current repository truth

- The active application is `app/web`: Next.js 16, React 19, TypeScript, and SQLite through Node's `node:sqlite`.
- The live WordPress store and any production environment are outside this repository's verified state. This README does not claim production readiness, deployment, or cutover.
- Current scope, deferrals, and readiness: `docs/07-status-roadmap.md`.
- Local, container, preview-preparation, and deployment-safety guidance: `app/web/OPERATIONS.md`.
- Historical handoff documents `docs/01-vision.md` through `docs/06-tech-stack.md` are archived context. Their Nuxt/Laravel topology and production claims are not the current implementation.

## Development

Use Node.js 24 and run from `app/web`:

```bash
npm ci
npm run lint
npm test
npm run verify
npm run build
```

GitHub Actions runs the same checks on pushes and pull requests. It does not deploy.

## Governance and licensing

CyberOS machine gates are necessary but do not replace the two required human acceptance verdicts. See `docs/governance/hitl-policy.md`.

This repository is private and proprietary; see `LICENSE`. The `@cyberskill/design` dependency is UNLICENSED/internal and is not granted for redistribution by this repository's license.
