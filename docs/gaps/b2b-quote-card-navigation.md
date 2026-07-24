# B2B quote-card navigation gap

## Result

The current checkout cannot safely add click-through behavior to B2B quote-pipeline cards. The handoff documents real `quotes_pipeline` data, quote management, B2bQuote lifecycle labels, and missing pipeline-card routes. This checkout has no `app/` source tree, card component, quote-management destination, route contract, identifier, payload, authorization source, test suite, synthetic fixture, or approved non-production route.

## Evidence

- `docs/03-portals.md:44-46` documents real B2B pipeline data and quote management, while cards lack click-through routes.
- `docs/07-status-roadmap.md:47` identifies B2B pipeline card routes as missing.
- `docs/05-data-model.md:38-45` documents B2bQuote lifecycle labels without a route contract.
- `docs/README.md:21-23` prohibits local application execution and committed secrets.

## Recorded gaps

| Required boundary | Current state | Safe next action |
| --- | --- | --- |
| Pipeline-card and quote-management source paths | No `app/` source tree, card component, quote page, route, controller, or test file is present. | Obtain authorized source read access before naming a navigation target. |
| Existing destination and route contract | The handoff confirms quote management but not its destination, route name, path parameter, query contract, or fallback behavior. | Obtain source-confirmed navigation contract before adding a click action. |
| Quote identifier and pipeline payload | The handoff names real pipeline data but not card payload fields or the stable quote identifier. | Obtain source-confirmed payload and identifier behavior before linking a card. |
| Authorization and ownership behavior | No source establishes which role may open a quote context, how access failure behaves, or how organization ownership applies. | Obtain source-confirmed authorization behavior before exposing navigation. |
| Test entry points and safe fixture | No package manifest, test configuration, synthetic quote or pipeline fixture, or navigation-test convention is present. | Obtain source-confirmed test commands and an approved non-production fixture contract. |
| Approved non-production verification route | The task must not run locally or use a live B2B or administrative session, and no preview route or owner-approved test access is available. | Obtain an approved non-production route before recording a navigation result. |

## Scope outcome

No card action, route, destination, identifier, payload, authorization behavior, quote lifecycle, conversion action, credential, administrative session, or application behavior was changed, and no navigation result was claimed. This record does not invent a route, destination, query, identifier, payload, role policy, fallback, test command, fixture, account, credential, preview result, or quote behavior. It does not use production data, a live B2B or administrative session, a local application session, or credentials in task artefacts.
