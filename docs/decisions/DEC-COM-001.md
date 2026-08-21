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

**Interim owner defaults 2026-08-21** — revisable. Supersedes interim-defaults-2026-08-20.

Conservative marketplace posture for Sách Việt / CyberSkill sandbox→staging: USD, tax still **0** until legal review, physical carriers still **none** / flat **$0**, with named ship-to scope and address field inventory for future checkout wiring. Does **not** authorize live payment keys or complex VAT tables.

## Authority (owners fill)

| Role        | Name                          | Date       | Signature                           |
| ----------- | ----------------------------- | ---------- | ----------------------------------- |
| Owner       | CyberSkill operator (interim)| 2026-08-21 | interim-owner-defaults-2026-08-21   |
| Commerce    | CyberSkill operator (interim) | 2026-08-21 | interim-owner-defaults-2026-08-21   |
| Tax counsel | Deferred — tax still 0       | 2026-08-21 | N/A until tax > 0 is accepted        |

## Fields to accept (owners fill; leave blank until signed)

| Field                       | Accepted value | Notes |
| --------------------------- | -------------- | ----- |
| Countries / states in scope | **Interim owner defaults 2026-08-21: ship-to / sale scope US + VN only** (country codes `US`, `VN`). No US state-level nexus table. | Override before multi-country expansion. |
| Address fields              | **Interim: when physical ship is enabled later, collect** `name`, `line1`, `city`, `country` (`US`\|`VN`), `postal`. Optional: `line2`, `state`/`province`, `phone`. | Not required on current no-ship checkout path. |
| Tax source                  | **Tax = 0 / none (interim).** Source: `none/0` — no tax engine, nexus %, or VAT table until legal review. Order total = line subtotal (USD) only. | Prefer zero until counsel; do not invent rates. |
| Shipping rates / carriers   | **Shipping = none / flat $0.** Carriers: **none**. Align with PayPal `NO_SHIPPING` until a carrier package is accepted. | Physical carrier rate cards still deferred. |
| Delivery promises           | **None accepted.** Fulfillment overlays are operational notes only — not a carrier SLA. | — |
| Add-on prices               | **None / deferred.** No gift-wrap, insurance, or add-on SKUs. | — |
| Promotions                  | **None / deferred.** No coupon or campaign engine until owner supplies rules. | — |
| Cancellation window         | **Interim: customer may abandon before `paid`; after `paid`, use `DEC-RET-001` for refund path — no broad self-serve cancel.** | Align RET. |
| Reservation window          | **30 minutes** for `pending_payment` stock hold (`PENDING_ORDER_TTL_MS`). Expired → `payment_failed` + restock. | Codifies shipped TTL. |

## Accepted values

**Version:** interim-owner-defaults-2026-08-21  
**Currency:** USD (text / decimal money; `orders.currency = USD`).  
**Countries:** US + VN only (interim).  
**Address fields (future physical):** name, line1, city, country, postal (+ optional line2/state/phone).  
**Tax:** 0 — source `none/0`; no VAT table.  
**Shipping:** none / $0; carriers **none**; PayPal `NO_SHIPPING` remains.  
**Payments:** sandbox / test-mode only; live keys refused (`DEC-PV3-001`).  
**Promotions / add-ons:** none.  
**Reservation:** 30 minutes pending-payment TTL.  
**Cancellation:** pre-paid abandon only; post-paid → RET.

## Explicit non-values

This interim signature must **not** be read as: real tax jurisdictions beyond US+VN naming, VAT/GST rate cards, carrier SLAs, live Stripe/PayPal, or invented promotion percentages. Taxed retail and carriers still need a later revision that sets tax > 0 and/or carrier rates.

## History

- **2026-08-20:** interim-defaults — USD, tax 0, no ship, no address/countries named.
- **2026-08-21:** interim-owner-defaults — named US+VN + address inventory; tax still 0; shipping still none/$0.
