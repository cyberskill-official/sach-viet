# Royalty policy proposal v0.1

## Document status

Version: v0.1

Status: proposal with unresolved financial rules

Activation: prohibited until an owner records acceptance for each financial rule and a separate implementation task is approved

## Purpose

This document separates source-confirmed facts from financial decisions that remain unresolved. It does not set a royalty rate, split, eligibility rule, payment term, payout rule, earnings calculation, financial ledger, or dashboard value.

## Source-confirmed context

- Publisher dashboard pages for royalties, sales, and contracts are fully mocked, and author dashboard earnings are mocked (`docs/03-portals.md:52-58`).
- The royalty and earnings model is an owner product decision before backend work and unblocks the publisher and author portals (`docs/06-tech-stack.md:49`; `docs/07-status-roadmap.md:25,32,59`).
- Order and OrderItem records relate to Product and ProductVendor, and stored money uses cents-free USD decimals while the frontend formats VND and USD (`docs/05-data-model.md:21-23,68`).
- PublishingRequest records manuscript or catalog submissions and PublishingRequestLog records stage history (`docs/05-data-model.md:50-52`).
- Publisher and author are distinct roles with their own portal routes (`docs/04-roles-permissions.md:16-17,38-39,54-55`).

## Decision register

| Financial rule | Source state | Proposal status | Owner acceptance needed before activation |
| --- | --- | --- | --- |
| Royalty eligibility | No source defines which product, sale, publishing request, contract, publisher, or author qualifies. | Unresolved | Define eligibility and authoritative relationships. |
| Rate and split | No rate, percentage, party split, or adjustment source is available. | Unresolved | Set applicable rates, parties, and precedence. |
| Sales basis and allocation | Orders and OrderItems are documented, but no source maps a sale to a royalty recipient or allocation basis. | Unresolved | Define recognized sale event, allocation, returns, and adjustments. |
| Recoupment and advances | No advance, cost recovery, reserve, or recoupment policy is documented. | Unresolved | Define whether these exist and their accounting treatment. |
| Reporting period and currency | Stored money is documented as USD decimals and frontend formatting supports VND and USD, but no royalty reporting period or currency policy is documented. | Partially source-confirmed context; financial rule unresolved | Define reporting calendar, display currency, conversion source, and rounding rule. |
| Tax and withholding | No tax, withholding, invoice, or regulatory source is documented. | Unresolved | Define legal review, tax handling, and required documents. |
| Payout and payment authority | No royalty payout approval, payment instruction, or settlement rule is documented. | Unresolved | Define approval roles, payment method, controls, and audit requirements. |
| Contract attribution and visibility | Publisher and author roles and portal routes are documented, but no contract, recipient, or earnings-visibility relationship is documented. | Unresolved | Define contract source, recipient attribution, access boundaries, and dispute handling. |

## Activation gate

No application behavior may activate from this proposal. Before a royalty computation, earnings view, financial persistence, payout, payment instruction, invoice, or dashboard value can begin, an owner must explicitly accept every applicable row in the decision register and authorize a separate implementation task. An accepted rule must identify its effective date, source of authority, relationship inputs, calculation method, access boundary, and amendment path.

## Explicit exclusions

This proposal does not choose any financial value or behavior. It does not calculate earnings, create a ledger, persist a policy, issue a payout, send a payment instruction, expose a financial dashboard, use production data, use credentials, run the application, deploy, push, or merge.
