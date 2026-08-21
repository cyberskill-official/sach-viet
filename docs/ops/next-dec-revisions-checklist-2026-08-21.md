# Next DEC revisions checklist — 2026-08-21

**Verdict:** interim-DEC-unblocked **product** work on `main` is exhausted (`089a160` + Production migrate `007`). Further packages need **owner DEC field overrides** — do **not** invent rates.

**Baseline:** `main` @ `089a160` · Production `https://sachviet.cyberskill.world` · `/api/ready` → migration `007_storage_object_registry`, release SHA `089a160…`  
**Tracker:** [`docs/plans/sachviet-adjusted-completion-tracker.md`](../plans/sachviet-adjusted-completion-tracker.md)  
**Interim blocker note:** [`dec-accepted-values-blocker-2026-08-20.md`](dec-accepted-values-blocker-2026-08-20.md)

## Hard stop (do not implement until fields below are filled)

| Unlock | DEC | Exact fields to revise (Accepted values) | Unlocks |
| --- | --- | --- | --- |
| Taxed retail + physical ship | `DEC-COM-001` | **Countries / states in scope**; **Address fields**; **Tax source** (engine/nexus/% or table — not “0”); **Shipping rates / carriers**; optional Delivery promises, Add-on prices, Promotions, post-paid Cancellation | Phase 3 taxed B2C; carriers; address-bearing checkout |
| Returns / refunds | `DEC-RET-001` | **Return eligibility** + **Timing** (window days); **Evidence requirements**; **Restock rules** (fee %); **Refund allocation**; Inspection / Exchanges / Damage-loss as needed | `FL-B2C-12`, `FL-RET-04`, returns workflow |
| Vendor settlement | `DEC-SET-001` | **Commission** rate; **Reserve** %/hold days; **Cadence**; **Threshold**; **Bank / rail**; Approvals / Failed transfer / Reversals / Disputes; Provider-fee policy | `PKG-31`, settlement compute (remove refuse) |
| Royalties | `DEC-ROY-001` | **Rates / splits**; **Recognition**; **Advances**; **Reserves**; **Periods**; Statements / Payout / Disputes; Returns treatment (after RET) | `PKG-61`, royalty statements |
| B2B commercial terms | `DEC-B2B-001` | **Quote validity** (N days); **Discount authority**; **Invoice and credit terms** (Net-N, credit limit, late fee); Payment evidence; Partial delivery; MARC license fees; align Tax/Shipping with revised COM | B2B Net-N / discounts / SLA claims |
| Binding rights / editorial | `DEC-PUB-001` | **Editorial stages** (canonical list); **Authority**; **Rights** split; **Territories**; **Formats**; **Terms**; Signatures / Termination; ISBN/MARC authority | Binding publisher/author rights (shells ≠ policy today) |
| Live pay (PV3) | `DEC-PV3-001` | **Maximum live test amount**; **Controlled accounts**; **Refund authority**; **Accounting label**; **Stripe reviewer**; **PayPal reviewer**; keep Abort rule; then **explicit operator deploy** | Live keys / `PKG-81`–`82` — interim is **not** go |
| US region / Auth / `app` schema / WP DNS | `DEC-OPS-001` | **Region / topology** (name US move if desired); **Identity / schema** (Auth cutover + private `app`); optional Availability/Traffic/Cost numbers; WP DNS stays refused unless explicitly overridden | US move, Supabase Auth, `app` cutover, WP DNS |
| Privacy TTLs / deletion | `DEC-PRIV-001` | **Retention by record type** (day calendar); **Export**; **Deletion** SLA; Anonymization / Legal hold as needed | Automated purge / self-serve deletion |
| Zalo OA | `DEC-COMMS-001` | **Zalo OA policy** (OA id + approval); optional branded vi/en templates, Bounce/suppression | Zalo channel activation |

## Already acceptable under interim (do not “revise to unlock” fake numbers)

- COM: USD, tax **0**, no ship / `NO_SHIPPING`, 30m reservation, sandbox payments
- PV3: live **refused**; sandbox only
- OPS: stay APAC `eskazygpnygqsrcwlszz`; `sv_session` + public schema; WP DNS refused
- SET/ROY/RET/PUB/B2B Net-N: **honest deferral** + refuse-compute scaffolds on `main`

## Process after owner fills fields

1. Edit the DEC markdown Accepted-values tables (new version stamp; keep prior interim in history notes if useful).
2. Update [`dec-accepted-values-blocker-2026-08-20.md`](dec-accepted-values-blocker-2026-08-20.md) or supersede with a dated note.
3. Open product tasks for the unlocked package(s) only — still no invented leftovers.
4. HITL: `TASK-PLT-002` / `TASK-COM-003` / `TASK-UI-004` remain `ready_to_review` until operator records review + final acceptance (CyberOS).

## Explicit non-goals until revision + operator instruction

- Inventing tax/shipping/commission/royalty/Net-N/%
- `sk_live_*` / `PAYPAL_MODE=live`
- WordPress DNS cutover
- Forcing Supabase Auth, US-region move, or private `app` schema cutover
- New Vercel Production promote beyond auto-deploy already on `089a160`
