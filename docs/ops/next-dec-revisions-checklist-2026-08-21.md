# Next DEC revisions checklist — 2026-08-21

**Verdict:** **Interim owner defaults 2026-08-21b filled** (second pass after #40/#41) — revisable. Unlocks tax/shipping **stub** path, sandbox PV3 evidence procedures, and Auth/`app` migration **scaffolding**. **Live PV3, tax>0/carriers, US/Auth/`app`/WP cutovers, and Zalo OA remain blocked** as documented per-DEC.

**Baseline:** `main` @ `cbf8b2f` (PR #41 product unlock) · Production `https://sachviet.cyberskill.world`  
**Tracker:** [`docs/plans/sachviet-adjusted-completion-tracker.md`](../plans/sachviet-adjusted-completion-tracker.md)  
**21 defaults note:** [`dec-accepted-values-owner-defaults-2026-08-21.md`](dec-accepted-values-owner-defaults-2026-08-21.md)  
**21b defaults note:** [`dec-accepted-values-owner-defaults-2026-08-21b.md`](dec-accepted-values-owner-defaults-2026-08-21b.md)

## Field fill status (2026-08-21b)

| Unlock | DEC | Status | Accepted summary (interim) | Still blocked? |
| --- | --- | --- | --- | --- |
| Taxed retail + physical ship | `DEC-COM-001` | **Filled (stub unlock)** | US+VN; address **required** on ship-to path; tax **0%**/`none`/`stub` (`$0.00` line); `flat_rate_usd: 0`; carrier `none`; optional `manual_pickup` | **Yes for tax>0 and physical carriers** |
| Returns / refunds | `DEC-RET-001` | **Filled** (21) | 14d defect window; photo optional; restock 0%; original-method refund | Thin product OK |
| Vendor settlement | `DEC-SET-001` | **Filled** (21) | 15% commission; reserve 0; weekly; $50; manual/sandbox | Compute OK; live ACH no |
| Royalties | `DEC-ROY-001` | **Filled** (21) | Author 10% net; quarterly; no advances | Compute OK |
| B2B commercial terms | `DEC-B2B-001` | **Filled** (21) | Quote 30d; admin max 20% discount; Net-30 | Credit limit / late fee still deferred |
| Binding rights / editorial | `DEC-PUB-001` | **Filled** (21) | draft→review→published; worldwide en+vi; terms TBD | Terms URL / ISBN still deferred |
| Live pay (PV3) | `DEC-PV3-001` | **Reaffirmed refuse + sandbox evidence OK** | Sandbox only; max live test **not authorized** (incl. `$0`); sandbox PV3 evidence procedures authorized; no Vercel live keys | **Yes — live go** |
| US / Auth / `app` / WP | `DEC-OPS-001` | **Reaffirmed stay + scaffold OK** | APAC; `sv_session`; public schema; Storage postgres; WP refused; migration packages **scheduled but not executed** | **Yes — cutovers** |
| Privacy TTLs | `DEC-PRIV-001` | **Filled** (21) | Orders 24m; logs 30d; export/deletion 30d SLA | Purge jobs may use TTLs |
| Zalo OA | `DEC-COMMS-001` | **Reaffirmed defer** | SMTP keep; **`zalo: deferred until OA id provided by operator`** | **Yes — Zalo** |

## Process after fill

1. ~~Edit DEC Accepted-values tables~~ — done (`interim-owner-defaults-2026-08-21` then **`2026-08-21b`**).
2. Update / supersede blocker note — 21b note alongside this checklist.
3. Open product tasks for unlocked packages only — tax/shipping stub, sandbox PV3 evidence, Auth/`app` scaffold; **no live PV3**, no invented leftovers beyond Accepted values.
4. HITL: `TASK-PLT-002` / `TASK-COM-003` / `TASK-UI-004` remain `ready_to_review` until operator records review + final acceptance (CyberOS).

## Explicit non-goals (still)

- Inventing tax>0 / carrier rate cards beyond none/$0 / `manual_pickup` stub
- `sk_live_*` / `PAYPAL_MODE=live` / Vercel live keys
- WordPress DNS cutover
- Forcing Supabase Auth, US-region move, or private `app` schema cutover (scaffold only)
- Inventing Zalo OA ids
