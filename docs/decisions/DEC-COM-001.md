---
id: DEC-COM-001
title: Commerce, tax, shipping, promotions, and reservation policy
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-21"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
  - docs/ops/next-dec-revisions-checklist-2026-08-21.md
  - docs/ops/dec-accepted-values-owner-defaults-2026-08-21b.md
  - app/web/src/lib/commerce-core.mjs
blocks:
  - FL-B2C-06
  - FL-B2C-07
  - FL-B2C-08
  - FL-B2C-09
  - FL-B2C-10
  - FL-B2C-11
  - FL-B2C-12
  - vendor/retail fulfillment
---

# DEC-COM-001

**Interim owner defaults 2026-08-21b** — revisable. Supersedes interim-owner-defaults-2026-08-21.

Conservative marketplace posture for Sách Việt / CyberSkill sandbox→staging: USD, ship-to **US + VN**, tax still **0%** via an explicit **stub tax engine** (always `$0.00` tax line; `taxSource: none`), shipping **flat_rate_usd: 0** / carrier id **`none`**, optional stub carrier **`manual_pickup` only**. Does **not** invent VN VAT %, US state tables, or physical carrier rate cards. Does **not** authorize live payment keys.

## Authority (owners fill)

| Role        | Name                          | Date       | Signature                            |
| ----------- | ----------------------------- | ---------- | ------------------------------------ |
| Owner       | CyberSkill operator (interim)| 2026-08-21 | interim-owner-defaults-2026-08-21b   |
| Commerce    | CyberSkill operator (interim) | 2026-08-21 | interim-owner-defaults-2026-08-21b   |
| Tax counsel | Deferred — tax still 0% stub | 2026-08-21 | N/A until tax > 0 is accepted         |

## Fields to accept (owners fill; leave blank until signed)

| Field                       | Accepted value | Notes |
| --------------------------- | -------------- | ----- |
| Countries / states in scope | **Ship-to / sale scope US + VN only** (country codes `US`, `VN`). No US state-level nexus table. | Override before multi-country expansion. |
| Address fields              | **Required on stub retail checkout path that collects ship-to:** `name`, `line1`, `city`, `country` (`US`\|`VN`), `postal`. Optional: `line2`, `state`/`province`, `phone`. | Enables address capture without enabling taxed/carrier retail. |
| Tax source                  | **Sales tax rate 0% interim.** `taxSource: none`. `taxEngine: stub` — quote/order always emit a tax line of **`$0.00`**. No nexus %, VN VAT, or US state tables. | Prefer zero until counsel; do not invent rates. |
| Shipping rates / carriers   | **`flat_rate_usd: 0`**, carrier id **`none`**. Physical carriers remain **none**. Optional stub carrier id **`manual_pickup`** only (still `$0`). Align PayPal preference with no paid shipping. | Physical carrier rate cards still deferred. |
| Delivery promises           | **None accepted.** Fulfillment overlays are operational notes only — not a carrier SLA. | — |
| Add-on prices               | **None / deferred.** No gift-wrap, insurance, or add-on SKUs. | — |
| Promotions                  | **None / deferred.** No coupon or campaign engine until owner supplies rules. | — |
| Cancellation window         | **Interim: customer may abandon before `paid`; after `paid`, use `DEC-RET-001` for refund path — no broad self-serve cancel.** | Align RET. |
| Reservation window          | **30 minutes** for `pending_payment` stock hold (`PENDING_ORDER_TTL_MS`). Expired → `payment_failed` + restock. | Codifies shipped TTL. |

## Accepted values

**Version:** interim-owner-defaults-2026-08-21b  
**Currency:** USD (text / decimal money; `orders.currency = USD`).  
**Countries:** US + VN only (interim).  
**Address fields (stub checkout when ship-to collected):** name, line1, city, country, postal (+ optional line2/state/phone) — **required** on that path.  
**Tax:** rate **0%**; `taxSource: none`; `taxEngine: stub`; tax line always `$0.00`.  
**Shipping:** `flat_rate_usd: 0`; carrier id **`none`**; optional stub **`manual_pickup`** only; no physical carrier cards.  
**Payments:** sandbox / test-mode only; live keys refused (`DEC-PV3-001`).  
**Promotions / add-ons:** none.  
**Reservation:** 30 minutes pending-payment TTL.  
**Cancellation:** pre-paid abandon only; post-paid → RET.

## Explicit non-values

This interim signature must **not** be read as: real tax jurisdictions beyond US+VN naming, VAT/GST/state rate cards, carrier SLAs, live Stripe/PayPal, or invented promotion percentages. Taxed retail (tax > 0) and physical carriers still need a later revision.

## History

- **2026-08-20:** interim-defaults — USD, tax 0, no ship, no address/countries named.
- **2026-08-21:** interim-owner-defaults — named US+VN + address inventory; tax still 0; shipping still none/$0.
- **2026-08-21b:** interim-owner-defaults — `taxEngine: stub` + always `$0.00` tax line; address fields **required** on ship-to capture path; `flat_rate_usd: 0` / carrier `none`; optional `manual_pickup` stub only.
