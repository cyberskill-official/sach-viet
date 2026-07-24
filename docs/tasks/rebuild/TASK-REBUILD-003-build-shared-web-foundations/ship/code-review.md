# Code review

| Area | Result |
| --- | --- |
| Locale handling | Vietnamese fallback, English catalog, and safe missing-key behavior are tested. |
| Theme handling | Light, dark, and glass themes are constrained to known values and use one local preference key. |
| Access checks | The generic portal route uses the Task 2 server session and role helpers. |
| Public storefront | Ecom remains public while named staff and partner portals require server authorization. |
| Shared UI | Portal shell, navigation, data table, empty state, and localized paging labels have no business workflow. |
| Accessibility | Reduced-motion CSS is checked by the verifier. |
| Quality | Build, lint, tests, coverage, dependency audit, and Compose validation pass. |

Docker image rebuilding remains unavailable because the local Docker daemon is not running. This is an environment note, not an application defect.
