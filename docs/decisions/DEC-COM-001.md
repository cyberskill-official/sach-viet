---
id: DEC-COM-001
title: Commerce, tax, shipping, promotions, and reservation policy
status: signed
template: decision@1
created_at: "2026-08-13T05:08:00Z"
signed_at: "2026-08-20"
source_ref:
  - docs/plans/sachviet-full-production-completion-plan.md
  - docs/plans/sachviet-adjusted-completion-tracker.md
  - docs/ops/dec-accepted-values-blocker-2026-08-20.md
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

**Interim defaults — owner may revise; supersedes unsigned empty body.**

Codifies current Production / golive interim commerce behavior (USD text amounts, tax not charged, PayPal `NO_SHIPPING`, sandbox payments only). Does **not** authorize inventing real-world tax jurisdictions, carrier rate cards, or live payment keys.

## Authority (owners fill)

| Role        | Name                         | Date       | Signature                          |
| ----------- | ---------------------------- | ---------- | ---------------------------------- |
| Owner       | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20        |
| Commerce    | CyberSkill operator (interim) | 2026-08-20 | interim-defaults-2026-08-20        |
| Tax counsel | Deferred — no tax charged    | 2026-08-20 | N/A until tax > 0 is accepted      |

## Fields to accept (owners fill; leave blank until signed)

| Field                       | Accepted value | Notes |
| --------------------------- | -------------- | ----- |
| Countries / states in scope | **Interim: no ship-to jurisdiction required.** Checkout does not collect carrier shipping address for quote; PayPal uses `shipping_preference: NO_SHIPPING`. Geographic sale scope remains “storefront available where the site is reachable” until owner names countries/states. | Override before Phase 3 physical shipping / tax work. |
| Address fields              | **Interim: none required for checkout.** Billing/shipping address collection deferred until tax or physical shipping is accepted. | Match current order model (no address columns in checkout path). |
| Tax source                  | **Tax = 0 / not charged (interim).** No tax engine, nexus table, or jurisdiction list accepted. Order total = line subtotal (USD) only. | Temporary commerce; owner must revise before charging tax. |
| Shipping rates / carriers   | **None / digital-or-no-ship interim.** No carriers, rate cards, or delivery zones. Align with PayPal `NO_SHIPPING` in `commerce-core.mjs`. | Physical shipping deferred to Phase 3 after owner rates. |
| Delivery promises           | **None accepted.** Fulfillment overlays (packing / shipped / delivered) are operational notes only — not a carrier SLA. | Do not treat UI status as a delivery contract. |
| Add-on prices               | **None / deferred.** No gift-wrap, insurance, or other add-on SKUs accepted. | — |
| Promotions                  | **None / deferred.** No coupon, percent-off, or campaign engine accepted until owner supplies rules. | — |
| Cancellation window         | **Interim: customer may abandon before `paid`; after `paid`, no self-serve cancel policy accepted.** Staff/admin cancellation rules deferred with returns (`DEC-RET-001`). | Paid-order cancel needs owner + finance. |
| Reservation window          | **30 minutes** for `pending_payment` stock hold (`PENDING_ORDER_TTL_MS` in `commerce-core.mjs`). Expired rows → `payment_failed` + restock. | Codifies shipped TTL; owner may revise. |

## Accepted values

**Version:** interim-defaults-2026-08-20  
**Currency:** USD (text / decimal money as today; `orders.currency = USD`, `subtotal_usd`).  
**Tax:** 0 — not charged; no tax table.  
**Shipping:** none — PayPal `NO_SHIPPING`; no carrier rates.  
**Payments:** sandbox / test-mode only (`sk_test_…`, `PAYPAL_MODE=sandbox`); live keys refused until a later `DEC-PV3-001` live-go revision (this COM record does **not** unlock live).  
**Promotions / add-ons:** none.  
**Reservation:** 30 minutes pending-payment TTL.  
**Cancellation:** pre-paid abandon only; post-paid cancel deferred.

## Explicit non-values

This interim signature must **not** be read as: real tax jurisdictions, VAT/GST rates, carrier SLAs, live Stripe/PayPal, WordPress DNS cutover, or invented promotion percentages. Phase 3 tax/shipping work requires an owner revision of the Countries, Address, Tax source, and Shipping rows above.
