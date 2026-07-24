# Edge-case matrix

| ID | Trigger | Expected |
|---|---|---|
| ECM-001 | CapRover credentials absent | `prepared_local`, deployed=false |
| ECM-002 | `--target production` | `refused_production` |
| ECM-003 | `--authorize-remote` without operator path | `refused_unauthorized_remote` |
| ECM-004 | Missing captain-definition / Dockerfile / OPERATIONS markers | `packaging_invalid` |
| ECM-005 | Default-path source contains fetch/deploy primitives | verify/assert fails |
| ECM-006 | WordPress import core present | verify confirms it remains intact |
