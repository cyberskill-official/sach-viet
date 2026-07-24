# Edge-case matrix

| ID | Condition | Expected outcome | Evidence |
| --- | --- | --- | --- |
| ECM-001 | An unsupported locale is requested | The shared locale helper returns Vietnamese. | `web-foundations.test.mjs` |
| ECM-002 | A shared label is missing in one locale | The lookup returns the label key, not an exception. | `web-foundations.test.mjs` |
| ECM-003 | A user selects dark or glass theme | The selected theme is a valid shared theme token. | `web-foundations.test.mjs` |
| ECM-004 | A user selects an unknown theme | The helper returns the default light theme. | `web-foundations.test.mjs` |
| ECM-005 | A portal path is unknown | The portal config lookup returns no configuration. | `web-foundations.test.mjs` |
| ECM-006 | An allowed user reaches a portal shell | The server helper permits the portal. | `web-foundations.test.mjs` |
| ECM-007 | A role outside the portal mapping reaches a portal shell | The server helper denies the portal. | `web-foundations.test.mjs` |
| ECM-008 | The ecom portal is public | The shell permits it without a session. | `web-foundations.test.mjs` |
| ECM-009 | A table has no rows | The component model uses localized empty-state text. | `web-foundations.test.mjs` |
| ECM-010 | Reduced motion is preferred | CSS removes nonessential transitions. | `verify-web-foundations.mjs` |
