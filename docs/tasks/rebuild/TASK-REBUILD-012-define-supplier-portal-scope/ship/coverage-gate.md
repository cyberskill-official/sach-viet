# Coverage gate

Docs/decision-only verification (inspection class).

Checks performed and recorded in `inspection-evidence.txt`:

1. No `app/web/src/app/api/supplier` tree
2. No supplier-named page or lib core modules under `app/web`
3. Greenfield reservations remain in `access.mjs`, `web-foundations.mjs`, and `proxy.ts`
4. Decision artefact `supplier-portal-scope-decision.md` present
5. `TASK-SUPPLIER-001` remains `on_hold`
6. Task 10/11 notification + SSE files remain present

No application code was changed; no unit-coverage delta applies. Machine gates run to confirm the suite is undisturbed.
