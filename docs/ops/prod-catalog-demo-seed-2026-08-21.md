# Production catalog demo seed (2026-08-21)

Applied directly to Supabase project `eskazygpnygqsrcwlszz` (not via `seed:local`, which refuses Production).

## Ops
- Migration **`008_user_tour_progress`** applied + `schema_migrations` row → `/api/ready` ok.
- Catalog: 3 categories (`van-hoc`, `thieu-nhi`, `ky-nang`) + **10 Vietnamese book titles** with variants/offers (vendor = bootstrap admin). Day-2 demo product retained → **11** public products.
- One title (`mat-biec`) deliberately **out of stock** for buy-box demo.

## UI polish (code PR)
Storefront + Features: stronger Thủy·ocean hero wash, book-cover cards, clearer empty/loading states — see branch `feat/storefront-polish-seed-catalog`.
