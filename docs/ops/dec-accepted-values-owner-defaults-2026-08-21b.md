# DEC Accepted values — interim owner defaults 2026-08-21b

**Status:** **Interim owner defaults 2026-08-21b** (revisable) — second pass for still-blocked fields after #40/#41.  
**Prior:** [`dec-accepted-values-owner-defaults-2026-08-21.md`](dec-accepted-values-owner-defaults-2026-08-21.md) (PR [#40](https://github.com/cyberskill-official/sach-viet/pull/40))  
**Checklist:** [`next-dec-revisions-checklist-2026-08-21.md`](next-dec-revisions-checklist-2026-08-21.md)

## Defaults table (21b)

| Unlock | DEC | Accepted (21b) | Still needs human |
| --- | --- | --- | --- |
| Tax/shipping stub path | `DEC-COM-001` | USD; US+VN; address **required** on ship-to capture; tax **0%** / `taxSource: none` / `taxEngine: stub` (tax line always `$0.00`); `flat_rate_usd: 0`; carrier `none`; optional stub `manual_pickup` only | Real tax>0 rates; physical carrier cards; counsel |
| Live pay (PV3) | `DEC-PV3-001` | Live still **refused** (incl. `$0` live); **no** Vercel live keys; **sandbox-only PV3 complete evidence** procedures authorized | Live Stripe/PayPal secrets; live go gate |
| US / Auth / `app` / WP | `DEC-OPS-001` | APAC stay; `sv_session`; public schema; Storage postgres; WP refused; **migration packages scheduled but not executed** (scaffold OK) | Cutover dates; Auth secrets; US region; WP DNS |
| Zalo OA | `DEC-COMMS-001` | SMTP keep; **`zalo: deferred until OA id provided by operator`** | Zalo OA id |
| Returns / SET / ROY / B2B / PUB / PRIV | unchanged from 21 | Prior Accepted values remain | Live ACH; terms URL; counsel TTLs as needed |

## Engineering rules (additive)

- Implement tax **stub** path (always `$0.00` tax line + address capture US+VN) — do **not** invent VAT/state tables.
- Authorize **sandbox evidence scripts / TC rows** for PV3 — do **not** set `sk_live_` anywhere or in Vercel.
- Ship Auth / `app` migration **scaffolding only** — no cutover.
- Do **not** invent Zalo OA ids.

## Adjusted-plan gate (21b delta)

| Work | Allowed? |
| --- | --- |
| Tax/shipping stub + address capture | **Yes** |
| Sandbox PV3 evidence / TC matrix completion | **Yes** (sandbox only) |
| Auth/`app` migration package scaffolding | **Yes** (no cutover) |
| Live PV3 / US move / WP DNS / Zalo | **No** |
