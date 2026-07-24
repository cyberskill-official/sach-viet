# Notification bell verification gap

## Result

The current checkout cannot run a safe end-to-end verification of notification badges and deeplinks. The handoff says the notification backend and preference pages are done, and that verification remains pending across five portals with owner login. This checkout has no `app/` source tree, notification routes, portal mapping, preview URL, approved test-account route, fixture, or current rendered behavior.

## Evidence

- `docs/03-portals.md:26` names notification-bell E2E verification as pending.
- `docs/03-portals.md:62-67` describes in-app notifications and portal preferences as a shared system with badge and deeplink verification pending.
- `docs/07-status-roadmap.md:22` says the backend is done and badge and deeplink verification across five portals needs owner login.
- `docs/07-status-roadmap.md:58` proposes notification-bell E2E work after source and access are available.
- `docs/06-tech-stack.md:34` and `docs/06-tech-stack.md:46` describe future notification delivery choices, not a verified current E2E path.
- `docs/README.md:21-25` prohibits local application execution, public repositories, and committed secrets.

## Recorded gaps

| Required boundary | Current state | Safe next action |
| --- | --- | --- |
| Five-portal verification set | The handoff names five portals but does not enumerate them in the available checkout. | Obtain an authorized application source path or read access before selecting portal routes. |
| Badge state and count source | No notification component, API route, store, or fixture source is available. | Obtain an authorized application source path or read access before defining a badge assertion. |
| Deeplink destination mapping | No notification payload, route mapping, or expected destination source is available. | Obtain an authorized application source path or read access before defining a deeplink assertion. |
| Approved owner test access | Owner login is required, but no secure test-account route or preview access is available. | Obtain approved non-production access through the owner without placing credentials in repository artefacts. |
| Preview behavior and variance record | No preview URL, test fixture, or current rendered behavior is available. | Obtain an authorized preview verification method before recording portal results. |

## Scope outcome

No notification behavior was changed and no test result was claimed. This record does not invent a portal list, route, badge count, deeplink destination, account, credential, fixture, delivery mechanism, preference behavior, or preview result. It does not use production data, customer data, unapproved accounts, a local application session, or credentials in task artefacts.
