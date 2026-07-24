# Implementation plan

1. Add `b2c-parity-cutover-core.mjs` with closed B2C checklist, evidence matrix, cutover plan, and refusal paths.
2. Add tests covering closed statuses, greenfield evidence keys, live-parity refusal, unmet gates, and production/execute refusal.
3. Add `verify-b2c-parity-cutover-core.mjs` and wire into `npm run verify`.
4. Document matrix/plan as planning artefacts in `OPERATIONS.md`.
5. Commit ship artefacts: evidence matrix + cutover plan markdown/JSON (non-executing).
6. Leave on-hold cutover/migration tasks and prior rebuild cores untouched beyond verify/OPERATIONS wiring.
