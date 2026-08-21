# Next DEC revisions checklist — 2026-08-21

**Verdict:** **Interim owner defaults 2026-08-21 filled** on branch/PR for this date — revisable. Product may implement RET/SET/ROY/B2B/PUB wiring from Accepted values. **Live PV3, US/Auth/`app`/WP, Zalo OA, taxed retail (tax>0), and carriers remain blocked** as documented per-DEC.

**Baseline:** `main` @ pre-fill `089a160` / later merges · Production `https://sachviet.cyberskill.world`  
**Tracker:** [`docs/plans/sachviet-adjusted-completion-tracker.md`](../plans/sachviet-adjusted-completion-tracker.md)  
**Interim blocker note:** [`dec-accepted-values-blocker-2026-08-20.md`](dec-accepted-values-blocker-2026-08-20.md) (superseded in part by 2026-08-21 owner defaults)

## Field fill status (2026-08-21)

| Unlock | DEC | Status | Accepted summary (interim) | Still blocked? |
| --- | --- | --- | --- | --- |
| Taxed retail + physical ship | `DEC-COM-001` | **Filled (partial unlock)** | US+VN; address inventory; tax **0**/`none`; shipping **none/$0**; carriers **none** | **Yes for tax>0 and carriers** |
| Returns / refunds | `DEC-RET-001` | **Filled** | 14d defect window; photo optional; restock 0%; original-method refund | Thin product OK |
| Vendor settlement | `DEC-SET-001` | **Filled** | 15% commission; reserve 0; weekly; $50; manual/sandbox | Compute OK; live ACH no |
| Royalties | `DEC-ROY-001` | **Filled** | Author 10% net; quarterly; no advances | Compute OK |
| B2B commercial terms | `DEC-B2B-001` | **Filled** | Quote 30d; admin max 20% discount; Net-30 | Credit limit / late fee still deferred |
| Binding rights / editorial | `DEC-PUB-001` | **Filled** | draft→review→published; worldwide en+vi; terms TBD | Terms URL / ISBN still deferred |
| Live pay (PV3) | `DEC-PV3-001` | **Reaffirmed refuse** | Sandbox only; max live test **not authorized** | **Yes — live go** |
| US / Auth / `app` / WP | `DEC-OPS-001` | **Reaffirmed stay** | APAC; `sv_session`; public schema; Storage postgres; WP refused | **Yes — cutovers** |
| Privacy TTLs | `DEC-PRIV-001` | **Filled** | Orders 24m; logs 30d; export/deletion 30d SLA | Purge jobs may use TTLs |
| Zalo OA | `DEC-COMMS-001` | **Reaffirmed defer** | SMTP keep; Zalo deferred; **no OA id** | **Yes — Zalo** |

## Process after fill

1. ~~Edit DEC Accepted-values tables~~ — done (version `interim-owner-defaults-2026-08-21`).
2. Update / supersede blocker note — done alongside this checklist.
3. Open product tasks / implementation for unlocked packages only — **no live PV3**, no invented leftovers beyond Accepted values.
4. HITL: `TASK-PLT-002` / `TASK-COM-003` / `TASK-UI-004` remain `ready_to_review` until operator records review + final acceptance (CyberOS).

## Explicit non-goals (still)

- Inventing tax>0 / carrier rate cards beyond none/$0
- `sk_live_*` / `PAYPAL_MODE=live`
- WordPress DNS cutover
- Forcing Supabase Auth, US-region move, or private `app` schema cutover
- Inventing Zalo OA ids
