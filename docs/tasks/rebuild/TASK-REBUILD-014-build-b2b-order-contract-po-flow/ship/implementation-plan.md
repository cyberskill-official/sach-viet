# Implementation plan

1. Persist `b2b_orders`, line items, and private contract/PO artifacts with closed statuses.
2. Staff convert priced won quotes once; attach artifacts; confirm only with PO; cancel from awaiting_po.
3. Institution org-owned order reads (blind, no storage keys).
4. Tests + `verify-b2b-order-core.mjs`; wire into `npm run verify`.
