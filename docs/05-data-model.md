# 05 — Data Model (Entities by Domain)

> **Archived handoff context — not current implementation truth.** The Eloquent model and Laravel migration inventory below describes the superseded handoff. The active data implementation uses SQLite through the Next.js application in `app/web`; exact schema ownership is in its domain modules. Use `docs/07-status-roadmap.md` for current scope/status and `app/web/OPERATIONS.md` for operational guidance.

~45 Eloquent models, 65+ migrations. This is the conceptual map; read the migrations for exact columns.

## Catalog

```
Category ──< Product ──< ProductMedia
   │            ├──< ProductVariant
   │            ├──< Review (verified-purchase flag, spam-throttled)
   │            └──< ProductVendor >── VendorProfile (── User role=vendor)
   └── CategoryAlgorithm (per-category primary-vendor selection rules)
```

**The multi-vendor rule that surprises everyone:** `price` / `list_price` / stock live on **`product_vendors`**, NOT on `products`. A product with no vendor rows has no price. `PrimaryVendorService` picks the winning vendor per product (algorithm configurable per category); `ProductHydrator` merges the winner into API responses. Display price = `original_price` + discount logic.

## Commerce (B2C)

```
User ──< ShippingAddress
User ──< Order ──< OrderItem ──> Product/ProductVendor
Order: status, payment_method (stripe|paypal), payment_id,
       subtotal, shipping_cost, tax, total_amount
User ──< Wishlist (+ shareable public token)
Promotion (discount rules) · Banner · SidebarAd · HomeSection (homepage config)
```

Cart is **client-side only** (Pinia + localStorage) incl. add-ons (plastic cover, gift wrap) — it becomes an Order only at checkout. 1,633 orders / 4,061 items imported from WooCommerce.

## Marketplace operations

```
VendorProfile: application → admin approve/reject (with reason) → active
Payout ──< PayoutItem ──> OrderItem     (vendor settlement, admin-managed)
AuditLog (sensitive mutations)
```

## B2B / Institutional

```
Organization (library/school) ── User (role=school_librarian)
SelectionList ──< SelectionListItem ──> Product   (book lists institutions build)
B2bQuote (pipeline: draft → sent → negotiating → won/lost)
GoodsRequest ──< GoodsRequestItem   ("find me this book" — also B2C)
```

## Publishing

```
PublishingRequest (manuscript/catalog submission)
   └──< PublishingRequestLog (stage history)
MARC upload → MarcParser service (library cataloging records)
```

## Support & notifications

```
SupportTicket ──< TicketMessage / TicketEvent   (policy-gated, 8-layer access)
Notification / NotificationEventType (10+ trigger keys)
UserNotificationPreference / VendorNotificationPreference / UserChannel
Integration (Zalo OA…) · Setting (key-value) · search_logs (analytics)
```

## Conventions

- Timestamps everywhere; soft-delete only where a migration added it — check before assuming.
- WP-imported rows carry legacy identifiers; `WpImport` matches orders by `(billing_email→user_id, total_amount)`.
- Money: cents-free decimals in USD; VND↔USD formatting handled in frontend utils.
- Bulk-sync routes must be declared BEFORE `apiResource` in `api.php` (known 405 footgun).
