# Edge-case matrix

| ID | Trigger | Expected |
|---|---|---|
| ECM-001 | Closed checklist build | Only closed-set statuses; ≥12 B2C rows |
| ECM-002 | `greenfield_proven` without evidence_key | rejected |
| ECM-003 | `live_wp_parity_claimed: true` / forbidden claim fields | assertNoLiveParityClaim fails |
| ECM-004 | Matrix missing a required capability id | validateEvidenceMatrix fails |
| ECM-005 | Default prepareCutoverPlan | `plan_recorded`, executed=false, unmet owner/backup/rollback/deploy gates |
| ECM-006 | `target: production` | `refused_production` |
| ECM-007 | `execute: true` | `refused_live_cutover` |
| ECM-008 | Invalid checklist status | `invalid_matrix` |
| ECM-009 | Default-path source contains fetch/deploy/DNS primitives | assert fails |
| ECM-010 | Quality + wordpress-import cores present | verify confirms they remain intact |
