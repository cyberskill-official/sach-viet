# Coverage gate

Touched files: `notification-core.mjs`, notification routes, verify script, and new tests.

Primary evidence: `npm --prefix app/web run test` / `test:coverage` and `bash .cyberos/cuo/gates/run-gates.sh`.
`notification-core.mjs` line coverage is 97.95%; overall suite coverage is 96.89% lines / 91.43% functions. All 54 tests pass.
