# TC matrix progress — interim hardening (TASK-UI-004)

**As of:** 2026-08-20  
**Package:** `PKG-71` / `PKG-72` / `PKG-73` slice under interim DECs  
**Task:** `TASK-UI-004`

This is a **progress registry**, not a claim that every completion-plan `TC-*` is green. Full release suite remains after domain DEC revisions.

## Harness already on `main`

| Layer | Evidence | Status |
| --- | --- | --- |
| Unit / domain cores | `app/web/tests/*.test.mjs` via `npm test` | **partial** — broad coverage of shipped cores |
| Verify scripts | `npm run verify` (foundation → portal → search … + finance policy) | **partial** |
| HTTP / route suites | `*-route.test.mjs`, `*-http.test.mjs` | **partial** |
| Docker smoke | `npm run smoke:docker` / `tests/smoke-docker.test.mjs` | **partial** |
| Production smoke (sandbox) | `npm run smoke:production` | **partial** — unpaid checkout proof; live pay refused |
| Playwright | `npm run test:e2e` (TASK-TEST-002) | **partial** |
| Ready / health probes | `/api/ready`, `/api/health` + fingerprints | **partial** |
| Backup / restore drills | `tests/backup-restore.test.mjs` + scripts | **partial** |
| CSRF / RBAC | `tests/csrf-core.test.mjs`, SEC tasks | **partial** |

## Added this wave

| ID | Scenario | Status |
| --- | --- | --- |
| `TC-FIN-01` | Settlement compute refuses under DEC-SET | **covered** (`finance-policy-core.test.mjs`) |
| `TC-FIN-02` | Royalty compute refuses under DEC-ROY | **covered** |
| `TC-FIN-03` | Payout API rejects commissionRate fields | **covered** (vendor core + verify script) |
| `TC-POR-01` | Role portals load operational APIs (orders/offers/tickets/pipeline/requests) | **partial** — UI wired; full browser matrix still open |
| `TC-POR-02` | Finance banners show deferred without invented % | **partial** — UI + `/api/finance/policy` |

## Still open (honest gaps)

| Gap | Blocker |
| --- | --- |
| Full `TC-<flow>.*` release matrix | Domain packages + DEC revisions |
| Load / capacity / RPO gates (`PKG-73`) | Staging topology + operator drills |
| Live Stripe/PayPal paid path | `DEC-PV3-001` live refused |
| Settlement / royalty dollar correctness | `DEC-SET-001` / `DEC-ROY-001` rates |
| Production verification registry cleanup | `PKG-71` remainder + operator env |

## How to run locally

```bash
cd app/web
npm test
npm run verify
```

Do **not** treat green local tests as Production live-pay readiness.
