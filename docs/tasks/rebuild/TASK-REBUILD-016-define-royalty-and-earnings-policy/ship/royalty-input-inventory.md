# Greenfield royalty input inventory

## Inventory purpose

This inventory records source-confirmed and greenfield-confirmed inputs that may matter to a future royalty model and separates them from absent relationships. It is read-only planning evidence, not a calculation contract. <!-- authority: human-confirmed -->

## Recovered inputs

| Candidate input | Source-confirmed / greenfield fact | Provenance | Status for a royalty calculation |
| --- | --- | --- | --- |
| Order / order items | Commerce cores persist orders and line items with USD decimal money strings. | `docs/05-data-model.md`; greenfield `commerce-core.mjs` | Available as commerce context; no royalty eligibility or recognition rule is established. |
| Product / vendor offers | Catalog products and vendor offers exist; pricing lives on offers. | `docs/05-data-model.md`; greenfield `catalog-core.mjs` | Available as catalog context; no publisher or author royalty relationship is established. |
| Publishing workflow docs | PublishingRequest and PublishingRequestLog are documented for manuscript/catalog submission history. | `docs/05-data-model.md:47-53` | Available as publishing-workflow context; no greenfield publishing core or link to product/order/contract/earnings is established. |
| Money format context | Stored money uses cents-free USD decimals; display may include VND and USD. | `docs/05-data-model.md` | Available as format context only; no royalty currency, exchange, or rounding rule is established. |
| Publisher identity | `publisher` role, publisher portal ACL, purple accent, `/publisher` proxy matcher. | `docs/04-roles-permissions.md`; `access.mjs`; `web-foundations.mjs`; `proxy.ts` | Available as access context; no financial visibility, recipient, or approval rule is established. |
| Author identity | `author` role, author portal ACL, orange accent, `/author` proxy matcher. | `docs/04-roles-permissions.md`; `access.mjs`; `web-foundations.mjs`; `proxy.ts` | Available as access context; no financial visibility, recipient, or approval rule is established. |
| Existing portal state | Publisher royalty/sales/contracts and author earnings are mocked / blocked on the royalty model. | `docs/03-portals.md:52-58`; `docs/07-status-roadmap.md:20-36` | Blocks use as authoritative financial output. |
| Vendor payouts | Greenfield vendor payout APIs/cores exist for marketplace sellers. | `vendor-commerce-core.mjs`; `/api/vendor/payouts` | Explicitly **not** a royalty model; no source maps vendor payouts to publisher/author earnings. |

## Missing contracts

The available source does not establish an authoritative relationship among a product, vendor offer, publishing request, publisher, author, contract, order item, and royalty recipient. It does not establish a recognized sale event, rate, split, adjustment, recoupment, reporting period, currency conversion, tax, payment authority, payout control, or financial access policy for royalties or author earnings.

## Greenfield absences

- No `app/web/src/app/api/publisher/**`
- No `app/web/src/app/api/author/**`
- No royalty-core or earnings-core modules under `app/web/src/lib/`

## Safe recovery requirements

Before Tasks 17 or 18 activate financial behavior, recover the source-confirmed model and policy material for every required relationship. Record provenance for each recovered input. Keep missing inputs unresolved, and do not substitute a default rate, allocation, recipient, calculation, or payment rule. Obtain owner acceptance before using any recovered input in financial behavior. <!-- authority: human-confirmed -->

## Related non-rebuild artefacts (unchanged)

- `TASK-ROYALTY-001` remains `done`; `docs/royalty/royalty-policy-proposal-v0.1.md` and `docs/royalty/royalty-input-inventory.md` remain historical handoff evidence and are not mutated by this task.
- `TASK-PUBLISHER-001` remains `on_hold`.
- `TASK-AUTHOR-001` remains `done` as historical handoff evidence and is not mutated by this task.
