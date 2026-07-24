# Employee home-config editor backend gap

## Result

The current checkout cannot safely connect the employee home-config editor to a backend. The handoff confirms that the UI exists but is not wired, while this checkout has no `app/` source tree. It therefore cannot establish the editor component, composable, existing API route, model, validation, authorization guard, read behavior, or persistence behavior.

## Evidence

- `docs/03-portals.md:36-38` says the employee portal uses sub-role-filtered navigation, has an approval queue wired from the dashboard payload, and has a home-config edit UI that is not wired to a backend.
- `docs/07-status-roadmap.md:22-23` records the editor UI as existing and not wired to a backend.
- `docs/07-status-roadmap.md:57` lists wiring the editor as a first-work proposal after source and access are available.
- `docs/02-architecture.md:42` and `docs/02-architecture.md:48` describe the historical application layout, including employee portal pages and home-config composition, but that tree is absent from this checkout.
- `docs/README.md:21-25` prohibits local application execution, public repositories, and committed secrets.

## Recorded gaps

| Required boundary | Current state | Safe next action |
| --- | --- | --- |
| Editor location and data access path | No component or composable source is available. | Obtain an authorized application source path or read access before changing the UI. |
| Existing backend contract | No API route, model, payload, or validation source is available. | Obtain an authorized application source path or read access before wiring read or persistence behavior. |
| Employee authorization boundary | The handoff names role-filtered navigation, but no middleware or guard implementation is available. | Obtain an authorized application source path or read access before exposing configuration actions. |
| Read and persistence behavior | No source confirms what configuration is read, how it is persisted, or how failures are represented. | Obtain an authorized application source path or read access before connecting the editor. |
| Existing employee behavior | The approval queue and sub-role navigation are documented as current behavior, but no regression path is available. | Obtain an authorized application source path or read access before selecting regression checks. |

## Scope outcome

No editor or backend code was added. This record does not invent a home-config schema, endpoint, payload, validation rule, role policy, dashboard KPI behavior, approval-queue behavior, or navigation behavior. If recovered source confirms no backend contract, an owner must make the product or design decision before creating one.
