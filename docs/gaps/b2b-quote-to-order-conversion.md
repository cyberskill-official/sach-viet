# B2B quote-to-order conversion gap

## Result

The current checkout cannot support a safe B2B quote-to-order implementation. It contains handoff documents but no `app/` source tree, so it cannot establish the accepted quote state, existing order path, duplicate-prevention mechanism, role guard implementation, or broker-privacy enforcement.

## Evidence

- `docs/03-portals.md:46` says the B2B portal has real quote-pipeline data and quote management, while quote-to-order conversion is still needed.
- `docs/05-data-model.md:41` describes `B2bQuote` states as `draft`, `sent`, `negotiating`, and `won/lost`, but does not describe a B2B order model or conversion rule.
- `docs/04-roles-permissions.md:43` and `docs/04-roles-permissions.md:58` describe the intended `employee_b2b` and `admin` route boundary, but the corresponding application source is unavailable.
- `docs/01-vision.md:17` requires the institution not to see the upstream supplier, but the enforcement path is unavailable.
- `docs/07-status-roadmap.md:31` lists quote-to-order conversion as not started.

## Recorded gaps

| Required boundary | Current state | Safe next action |
| --- | --- | --- |
| Eligible quote state | No source rule is available. The handoff names `won/lost` but does not select a conversion state. | Obtain an authorized application source path or read access before selecting a state. |
| Existing order path and duplicate prevention | No source route, model, or idempotency mechanism is available. | Obtain an authorized application source path or read access before wiring conversion. |
| `employee_b2b` and `admin` authorization | The handoff documents the intended roles, but no guard implementation is available. | Obtain an authorized application source path or read access before exposing the action. |
| Broker privacy | The handoff requires supplier privacy, but no policy or serializer implementation is available. | Obtain an authorized application source path or read access before returning order data to institutions. |

## Scope outcome

No conversion code was added. This record preserves the task's guardrails: it does not invent a B2B order schema, approval rule, financial policy, shipping behavior, contract or purchase-order behavior, or supplier disclosure.
