# Implementation plan

1. Add `quality-preview-release-core` with checklist, offline packaging validation, credential detection, and prepare outcomes.
2. Add `prepare-preview-release` CLI and verify script; wire into `npm run verify` / `prepare:preview` / `quality`.
3. Document CyberOS gates, prepare:preview, and `prepared_local` in OPERATIONS.md.
4. Add core tests covering prepared_local, production refusal, unauthorized remote refusal, packaging invalid, and no-network denylist.
5. Do not push, deploy, merge, or store CapRover tokens.
