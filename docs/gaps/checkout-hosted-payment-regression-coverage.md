# Checkout and hosted-payment regression coverage gap

## Result

The current checkout cannot add or run safe checkout regression coverage. The handoff documents a Nuxt and Laravel application, Vitest frontend tests, minimal API tests, and Stripe and PayPal hosted checkout. This checkout has no `app/` source tree, checkout implementation, test suite, package or PHP test configuration, provider callback contract, purpose-made fixture, or approved non-production verification route.

## Evidence

- `docs/06-tech-stack.md:12` names Vitest for frontend tests and minimal API tests.
- `docs/06-tech-stack.md:17` names Laravel 10 and PHP 8.1 for the backend.
- `docs/06-tech-stack.md:47` recommends Vitest components and Laravel feature tests on money paths before other work.
- `docs/07-status-roadmap.md:7` describes the verified B2C browse, cart, Stripe or PayPal hosted checkout, and order-history flow.
- `docs/README.md:21-23` prohibits local application execution, public repositories, and committed secrets.

## Recorded gaps

| Required boundary | Current state | Safe next action |
| --- | --- | --- |
| Checkout implementation and test paths | No `app/` source tree, checkout route, component, controller, or test file is present. | Obtain an authorized source path or read access before naming a test target. |
| Vitest test entry and coverage configuration | The handoff names Vitest but this checkout has no package manifest, test configuration, or current frontend suite. | Obtain the source-confirmed test command and coverage configuration before writing frontend regression tests. |
| Laravel feature-test entry point | The handoff names Laravel and minimal API tests but no API source, PHPUnit configuration, or feature-test path is present. | Obtain the source-confirmed backend test entry point before writing API coverage. |
| Hosted-payment boundary and callback contract | Stripe and PayPal hosted checkout are named, but no session creation path, return handling, webhook, callback, or expected order-state source is present. | Obtain the authorized provider-boundary source before defining a payment assertion. |
| Safe fixture or test-double contract | No purpose-made checkout fixture, provider test double, or synthetic order-data convention is present. | Obtain an approved non-production fixture contract without placing keys, customer data, or production orders in task artefacts. |
| Approved non-production verification route | The checkout must not run locally or use live payments, and no preview route or owner-approved test access is available. | Obtain an approved non-production route before recording a checkout or hosted-payment test result. |

## Scope outcome

No checkout code, test, provider request, payment action, or application behavior was changed, and no regression result was claimed. This record does not invent a route, component, controller, test command, callback, order state, fixture, provider key, account, credential, preview result, or payment behavior. It does not use production data, customer data, live payments, a local application session, or credentials in task artefacts.
