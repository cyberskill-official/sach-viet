# DEC Accepted values blocker — 2026-08-20

**Status:** interim values on `main` (PR [#35](https://github.com/cyberskill-official/sach-viet/pull/35), merge `5df30cd`) — **owner may revise**  
**Scope:** all ten `docs/decisions/DEC-*.md` records  
**Merged branch:** `docs/dec-interim-accepted-defaults`

## What changed

Interim **Accepted values** were filled from current Production / golive policy (tracker + shipped code): USD; tax 0; no shipping / PayPal `NO_SHIPPING`; sandbox payments only; Supabase APAC stay; `sv_session` + public schema; WP DNS refused; finance/returns/editorial fields explicitly **deferred** with triggers (no invented %).

| Observation | Truth for engineering |
| --- | --- |
| YAML `status` is `signed` with filled Authority + Fields-to-accept + Accepted values | Treat as **interim signed** — owner may revise; supersedes empty unsigned bodies. |
| Deferrals (settlement %, royalty %, live PV3 go, return windows, Net-N, SLO/$) | **Are** Accepted values (honest deferral). They do **not** unlock inventing rates or live keys. |
| `DEC-PV3-001` | Live = **refused**. Sandbox only. **Not** “PV3 = go.” |
| Phase 3 tax/shipping | Still needs owner **override** of `DEC-COM-001` countries/address/tax/shipping rows before charging tax or physical ship. |

Engineers must **not** invent tax jurisdictions, carrier rate cards, commission/royalty tables, or live Stripe/PayPal beyond what these DEC bodies state.

## Per-DEC inventory (interim Accepted values)

| DEC id | Title | YAML status | Accepted values (summary) | Still blocked until owner override? |
| --- | --- | --- | --- | --- |
| `DEC-COM-001` | Commerce, tax, shipping, promotions, reservation | `signed` (interim) | USD; tax 0; no ship / `NO_SHIPPING`; 30m reservation TTL; promotions none; sandbox payments | **Yes for Phase 3 tax/shipping** — countries, address, tax source, carriers |
| `DEC-RET-001` | Returns / refunds | `signed` (interim) | Deferred until Phase 3; no window/fee/% | Yes for returns flags |
| `DEC-SET-001` | Vendor settlement | `signed` (interim) | Deferred until Phase 5; no commission rate | Yes for `PKG-31` |
| `DEC-ROY-001` | Royalties | `signed` (interim) | Deferred until Phase 5; no royalty rate; currency USD when later | Yes for `PKG-61` |
| `DEC-PUB-001` | Publishing / rights | `signed` (interim) | Deferred until Phase 4 binding stages/terms | Yes for binding rights |
| `DEC-B2B-001` | B2B terms | `signed` (interim) | Tax 0 / no ship align COM; Net-N / discount / validity deferred Phase 4 | Yes for commercial terms |
| `DEC-COMMS-001` | Email / Zalo | `signed` (interim) | SMTP/`SMTP_FROM`; mandatory identity+paid order; Zalo deferred; marketing off | Zalo until OA approval |
| `DEC-PRIV-001` | Privacy | `signed` (interim) | Named processors; retention day calendar deferred | Yes for typed TTLs / deletion SLA |
| `DEC-OPS-001` | Ops / region | `signed` (interim) | Stay APAC `eskazygpnygqsrcwlszz`; US deferred; `sv_session`; public schema; WP DNS refused; CyberSkill operator interim; SLO/$ deferred | US-region / Auth / `app` schema until dedicated packages |
| `DEC-PV3-001` | Live pay verification | `signed` (interim) | **Live refused**; sandbox only; no live max amount | Live go needs later revision + operator deploy |

## Owner checklist after merge (or on revise)

1. Review every Accepted value; override any interim default that is wrong for the business.
2. Before Phase 3 tax/shipping: revise `DEC-COM-001` (and align `DEC-B2B-001` tax/shipping). Until then, COM interim **tax 0** means “taxed retail” stays deferred.
3. Before Phase 5 settlement/royalties: revise `DEC-SET-001` / `DEC-ROY-001` with concrete rates.
4. Before live pay: revise `DEC-PV3-001` with max amount, accounts, reviewers — **then** explicit operator deploy. Never treat interim PV3 as go.
5. Keep dependent flags off where the DEC still says deferred.

## Adjusted-plan gate

Canonical tracker: [`docs/plans/sachviet-adjusted-completion-tracker.md`](../plans/sachviet-adjusted-completion-tracker.md).

| Adjusted phase | Allowed under interim DECs? |
| --- | --- |
| 0 — CDS ocean + auth UI parity | Yes (on `main`) |
| 1 — Fill DEC Accepted values | **Interim on `main` (#35); owner may revise** |
| 2 — Foundations delta (Storage / Auth plan / `app` schema strategy / obs); US-region still deferred per `DEC-OPS-001` | **Delta via TASK-PLT-002** — cutovers still later packages |
| 3 — B2C tax/shipping/returns | **Only after owner revises COM/RET** where concrete rates/windows are required (tax 0 interim ≠ taxed retail) |
| 4+ — portal depth / finance / live PV3 | Operational portal depth + refuse-compute finance scaffold allowed; rates / Net-N / live PV3 still follow per-DEC deferral |
**Phase 2+ that needs invented rates remains blocked.** Interim deferrals unblock documentation honesty and non-rate foundation work; they do not authorize fake tax/shipping/commission/royalty/live-pay numbers.
