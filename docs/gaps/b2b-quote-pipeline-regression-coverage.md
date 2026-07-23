# B2B quote-pipeline regression coverage gap

## Result

The current checkout cannot add or run safe B2B quote-pipeline regression coverage. The handoff documents the B2B quote lifecycle labels draft, sent, negotiating, won, and lost, real `quotes_pipeline` data in the B2B dashboard, quote management, and a thin testing bar. This checkout has no `app/` source tree, quote implementation, pipeline component, route, controller, test suite, lifecycle transition rules, B2B authorization source, synthetic fixture, or approved non-production verification route.

## Evidence

- `docs/05-data-model.md:38-45` names the B2B quote lifecycle as draft, sent, negotiating, won, and lost.
- `docs/03-portals.md:44-46` states that the B2B dashboard has real `quotes_pipeline` data and quote management, while pipeline-card click-through routes and quote-to-order conversion remain needed.
- `docs/06-tech-stack.md:12` names Vitest for frontend tests and minimal API tests.
- `docs/06-tech-stack.md:47` recommends Vitest components and Laravel feature tests on money paths, including quotes.
- `docs/07-status-roadmap.md:14` identifies B2B dashboards with pipeline data in the real dashboard payload.
- `docs/07-status-roadmap.md:31` identifies quote-to-order conversion as not started.
- `docs/07-status-roadmap.md:47` identifies missing B2B pipeline-card click-through routes.
- `docs/README.md:21-23` prohibits local application execution, public repositories, and committed secrets.

## Recorded gaps

| Required boundary | Current state | Safe next action |
| --- | --- | --- |
| Quote pipeline implementation and test paths | No `app/` source tree, B2B quote model, pipeline component, controller, route, action, or test file is present. | Obtain an authorized source path or read access before naming a test target. |
| Lifecycle state and transition contract | The handoff names draft, sent, negotiating, won, and lost, but does not establish implementation rules, guards, terminal behavior, or transition side effects. | Obtain the source-confirmed lifecycle contract before defining a state or transition assertion. |
| Frontend and backend test entry points | The handoff names Vitest and minimal API tests, but this checkout has no package manifest, test configuration, PHPUnit configuration, or current suite. | Obtain the source-confirmed test command and entry points before writing regression coverage. |
| B2B quote-management and authorization behavior | The B2B portal documents real pipeline data and quote management, but no role guard, action, data contract, or pipeline-card behavior source is available. | Obtain the authorized behavior and access source before defining a B2B regression scenario. |
| Safe fixture or test-double contract | No synthetic B2B organization, user, quote, pipeline, or lifecycle fixture convention is present. | Obtain an approved non-production fixture contract without placing credentials, customer data, or production records in task artefacts. |
| Approved non-production verification route | The task must not run locally or use a live B2B system, and no preview route or owner-approved test access is available. | Obtain an approved non-production route before recording a quote-pipeline regression result. |

## Scope outcome

No B2B code, test, quote state, pipeline action, conversion action, route, authorization behavior, or application behavior was changed, and no regression result was claimed. This record does not invent a lifecycle rule, endpoint, route, action, role guard, test command, fixture, account, credential, preview result, pipeline behavior, click-through behavior, or conversion behavior. It does not use production data, customer data, a live B2B system, a local application session, or credentials in task artefacts.
