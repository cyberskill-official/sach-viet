# B2C evidence matrix (greenfield capability coverage)

claim_mode: `greenfield_capability_coverage`
live_wp_parity_claimed: `false`

| Capability | Status | Evidence |
|---|---|---|
| Catalog browse, filter, and product detail | `greenfield_proven` | verify-catalog-core.mjs |
| Cart and Stripe hosted checkout | `greenfield_proven` | verify-commerce-core.mjs |
| Customer orders and order history | `greenfield_proven` | verify-commerce-core.mjs |
| Customer auth login and signed session | `greenfield_proven` | verify-identity.mjs |
| Support tickets | `greenfield_proven` | verify-support-core.mjs |
| Goods requests | `greenfield_proven` | verify-support-core.mjs |
| Vendor self-registration and admin approval | `greenfield_proven` | verify-admin-commerce-core.mjs |
| Vendor orders and payouts | `greenfield_proven` | verify-vendor-commerce-core.mjs |
| Admin commerce operations dashboard | `greenfield_proven` | verify-admin-commerce-core.mjs |
| Vietnamese-aware catalog search | `greenfield_proven` | verify-vietnamese-search-core.mjs |
| WordPress import compatibility (fixture-driven) | `greenfield_proven` | verify-wordpress-import-core.mjs |
| Quality checklist and offline preview prepare | `greenfield_proven` | verify-quality-preview-release-core.mjs |
| Wishlist and public share link | `source_gap` | — |
| PayPal hosted checkout (legacy storefront listed Stripe/PayPal) | `deferred_out_of_scope` | — |
| Side-by-side live WordPress vs greenfield storefront comparison | `evidence_unavailable` | — |

This matrix proves greenfield capability coverage via fixtures/APIs/tests. It does **not** claim live WordPress feature parity.

