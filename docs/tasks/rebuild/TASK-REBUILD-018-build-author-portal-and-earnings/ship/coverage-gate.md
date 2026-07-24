# Coverage gate

Touched files under test:

- `src/lib/author-portal-core.mjs` — create/list/detail/withdraw, dashboard, refuse paths
- `src/app/api/author/**` — signed-session route wiring (static assertions)
- `scripts/verify-author-portal-core.mjs` — boundary verification

Evidence: `node --test tests/author-portal-*.test.mjs` pass; full `npm test` 88/88 pass; `npm run verify` includes author verifier.
