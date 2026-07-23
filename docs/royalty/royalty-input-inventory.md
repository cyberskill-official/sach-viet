# Royalty input inventory

## Inventory purpose

This inventory records source-confirmed inputs that may matter to a future royalty model and separates them from absent relationships. It is read-only planning evidence, not a calculation contract.

## Recovered inputs

| Candidate input | Source-confirmed fact | Provenance | Status for a royalty calculation |
| --- | --- | --- | --- |
| Order | A User has Orders, and an Order has OrderItems. Order fields include status, payment method, payment ID, subtotal, shipping cost, tax, and total amount. | `docs/05-data-model.md:21-23` | Available as documented commerce context; no royalty eligibility or recognition rule is established. |
| OrderItem | An Order has OrderItems that relate to Product or ProductVendor. | `docs/05-data-model.md:21` | Available as documented commerce context; no recipient attribution or allocation rule is established. |
| Product and ProductVendor | Product may have ProductVendor records, and price, list price, and stock live on ProductVendor. | `docs/05-data-model.md:8-15` | Available as documented catalog context; no publisher or author royalty relationship is established. |
| Stored and display money context | Stored money uses cents-free USD decimals, and frontend utilities format VND and USD. | `docs/05-data-model.md:68` | Available as format context only; no royalty currency, exchange, or rounding rule is established. |
| PublishingRequest | PublishingRequest represents a manuscript or catalog submission. | `docs/05-data-model.md:50` | Available as publishing-workflow context; no link to a product, order item, contract, author earnings, or publisher earnings is established. |
| PublishingRequestLog | PublishingRequestLog records publishing stage history. | `docs/05-data-model.md:50-51` | Available as workflow context; no financial event or earnings trigger is established. |
| Publisher and author identities | Publisher and author are distinct external-partner roles with separate portal routes. | `docs/04-roles-permissions.md:16-17,38-39,54-55` | Available as access context; no financial visibility, recipient, or approval rule is established. |
| Existing portal state | Publisher royalty, sales, and contract dashboard areas are fully mocked, and author earnings are mocked. | `docs/03-portals.md:52-58`; `docs/07-status-roadmap.md:25` | Blocks use as authoritative financial output. |

## Missing contracts

The available source does not establish an authoritative relationship among a product, ProductVendor, publishing request, publisher, author, contract, order item, and royalty recipient. It does not establish a recognized sale event, rate, split, adjustment, recoupment, reporting period, currency conversion, tax, payment authority, payout control, or financial access policy.

## Safe recovery requirements

Before an implementation task starts, recover the source-confirmed model and policy material for every required relationship. Record provenance for each recovered input. Keep missing inputs unresolved, and do not substitute a default rate, allocation, recipient, calculation, or payment rule. Obtain owner acceptance before using any recovered input in financial behavior.
