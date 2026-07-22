# 01 — What is SachViet & Where It's Going

## One-liner

**SachViet is a global publishing & distribution ecosystem for Vietnamese books**, serving the Vietnamese diaspora in the US as its primary market, plus US libraries and schools buying Vietnamese-language materials.

Legal entity: **Sach Viet LLC** (Texas, USA). Live production: **https://sachviet.us** (currently legacy WordPress/WooCommerce — see below).

## The three business pillars

The platform being built (`app/`) is one codebase serving three distinct businesses:

### 1. B2C Marketplace (multi-vendor)
Retail storefront selling Vietnamese books to US consumers. Multiple **vendors** list inventory on the same product (one book, many sellers — think Amazon marketplace, not Shopify). Pricing lives in `product_vendors`, not `products`; a `PrimaryVendorService` algorithm picks which vendor wins the "buy box". Add-ons at cart level: plastic covers, gift wrapping. Payments: Stripe + PayPal (hosted checkout).

### 2. B2B Brokerage (blind)
Selling to **institutions** — US public libraries, school districts, universities. Flow: institution browses catalog → builds selection lists → requests quote → internal B2B staff quote and negotiate → PO-based ordering. "Blind" = the institution never sees the upstream supplier; SachViet is the broker. This includes MARC record support (library cataloging format) — publishers can upload MARC files.

### 3. Self-Publishing
**Authors** submit manuscripts, **publishers** submit catalogs. Publishing requests move through review stages. Long-term: print-on-demand + royalty tracking for Vietnamese-language authors abroad.

## Why the platform is being rebuilt

The current live store is WordPress + WooCommerce + Dokan (multi-vendor plugin) + Elementor. It works but is slow, plugin-bound, and can't express the B2B/self-publishing pillars. The new platform (`app/web` Nuxt + `app/api` Laravel) replaces it with purpose-built portals for all 9 user types.

**Transition state (July 2026):**
- `sachviet.us` (live revenue) = legacy WordPress — being migrated from Liquid Web hosting to our own CapRover server (app `sachviet-current`), staying alive until the new platform fully replaces it.
- `sachviet-web.server.sachviet.us/ecom` = the new Nuxt storefront (preview URL, real data via Laravel API).
- Data flows one way: WordPress → `WpImport` sync command → new platform DB. 1,633 real orders + 4,061 order items already imported.

## Vision / north star

1. **Short term** — new B2C storefront reaches feature parity with the WP store and takes over `sachviet.us`; WordPress is retired.
2. **Medium term** — B2B brokerage portal handles library/school quoting end-to-end (this is the highest-margin, least-competitive segment; the Harris County relationship is the wedge).
3. **Long term** — the self-publishing pillar makes SachViet the default publishing house for Vietnamese authors outside Vietnam: submit manuscript → review → publish → sell B2C + B2B through the same pipes.

## What "done" looks like for the incoming team

- All 9 portals wired to real APIs (several dashboards still show mocked data — see 07-status-roadmap.md).
- Checkout, vendor payouts, quote pipeline, and publishing workflow all verified end-to-end in production.
- WP retired; `sachviet.us` serves the Nuxt app.
