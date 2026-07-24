# Edge-case matrix

| Condition | Expected outcome | Evidence |
| --- | --- | --- |
| Build supplier portal now from reserved role | Rejected — no source-confirmed users/workflow/data boundary | `supplier-portal-scope-decision.md` |
| Remove supplier ACL/proxy/accent now | Rejected — no owner retire decision | `supplier-portal-scope-decision.md` |
| Recover legacy Nuxt/Laravel supplier middleware | Rejected — greenfield-only | `supplier-portal-scope-decision.md` |
| Equate supplier with vendor/publisher/author | Rejected — those have documented portal sections; supplier does not | `context-map.md`, portals inventory |
| This task adds supplier API or page | Must not happen | Inspection in `coverage-gate.md` |
| Mutate `TASK-SUPPLIER-001` | Must not happen | Frontmatter remains `on_hold` |
| Later implement trigger | Owner-defined users, workflow, data boundary, authorization → separate task | `supplier-portal-scope-decision.md` |
| Later retire trigger | Owner confirms no liaison need → separate remove-reservations task | `supplier-portal-scope-decision.md` |
