# Edge-case matrix

| Condition | Expected outcome | Evidence |
| --- | --- | --- |
| Invent a default royalty rate/split now | Rejected — owner product decision required | `royalty-policy-proposal.md` |
| Implement settlement ledger or payout automation in this task | Rejected — policy foundation only; no source settlement rules | `royalty-policy-proposal.md`, out-of-scope |
| Treat vendor marketplace payouts as royalties | Rejected — distinct pillar; no source mapping | `royalty-input-inventory.md` |
| Activate Tasks 17/18 financial dashboards on unresolved rules | Rejected — owner-acceptance activation gate | `royalty-policy-proposal.md` |
| Mutate `TASK-ROYALTY-001` or `docs/royalty/*` | Must not happen | Inspection / frontmatter |
| Un-hold or mutate `TASK-PUBLISHER-001` | Must not happen | Frontmatter remains `on_hold` |
| This task adds publisher/author financial APIs | Must not happen | `inspection-evidence.txt` |
| Missing relationship in source | Record as missing; do not substitute defaults | `royalty-input-inventory.md` |
| Later activation trigger | Owner accepts applicable decision-register rows + authorizes implement task | `royalty-policy-proposal.md` |
