# Greenfield royalty and earnings policy proposal

**Version:** greenfield-v0.1  
**Date:** 2026-07-24  
**Status:** proposal with unresolved financial rules  
**Activation:** prohibited until an owner records acceptance for each financial rule and a separate implementation task (TASK-REBUILD-017 / TASK-REBUILD-018 or later) is authorized to use that rule <!-- authority: human-confirmed -->

## Purpose

This document is the greenfield rebuild policy foundation for publisher royalties and author earnings. It separates source-confirmed context from unresolved financial decisions. It does not set a royalty rate, split, eligibility formula, payment term, payout rule, settlement schedule, earnings calculation, financial ledger, or dashboard financial value. <!-- authority: human-confirmed -->

## Source-confirmed context

- Self-publishing is a long-term pillar that includes royalty tracking for Vietnamese-language authors abroad (`docs/01-vision.md:19-21`).
- Publisher dashboard royalties/sales/contracts are fully mocked; author dashboard earnings/stages are mocked; both need a royalty model before real financial facts (`docs/03-portals.md:52-58`).
- The royalty and earnings model is an owner product decision before backend work and unblocks publisher and author portals (`docs/06-tech-stack.md:43-50`; `docs/07-status-roadmap.md:20-36`).
- Publisher and author are distinct roles with portal ACL, accents, and proxy matchers already reserved in greenfield `app/web` (`access.mjs`, `web-foundations.mjs`, `proxy.ts`).
- Greenfield has no `app/web/src/app/api/publisher` or `app/web/src/app/api/author` trees and no royalty or earnings core modules.

## Decision register

| Financial rule | Source state | Proposal status | Owner acceptance needed before activation |
| --- | --- | --- | --- |
| Royalty eligibility | No source defines which product, sale, publishing request, contract, publisher, or author qualifies. | Unresolved | Define eligibility and authoritative relationships. |
| Rate and split | No rate, percentage, party split, or adjustment source is available. | Unresolved | Set applicable rates, parties, and precedence. |
| Sales basis and allocation | Orders and order items exist in commerce docs/cores, but no source maps a sale to a royalty recipient or allocation basis. | Unresolved | Define recognized sale event, allocation, returns, and adjustments. |
| Recoupment and advances | No advance, cost recovery, reserve, or recoupment policy is documented. | Unresolved | Define whether these exist and their accounting treatment. |
| Reporting period and currency | Commerce money uses USD decimal strings; frontend may format VND and USD; no royalty reporting calendar or conversion rule is documented. | Partially source-confirmed context; financial rule unresolved | Define reporting calendar, display currency, conversion source, and rounding rule. |
| Tax and withholding | No tax, withholding, invoice, or regulatory source is documented. | Unresolved | Define legal review, tax handling, and required documents. |
| Payout and payment authority | Vendor marketplace payouts exist separately; no royalty payout approval, payment instruction, or settlement rule is documented. | Unresolved | Define approval roles, payment method, controls, and audit requirements distinct from vendor payouts. |
| Contract attribution and visibility | Publisher and author roles/routes are documented; no contract, recipient, or earnings-visibility relationship is documented. | Unresolved | Define contract source, recipient attribution, access boundaries, and dispute handling. |

## Activation gate

No greenfield application behavior may activate from this proposal. Before a royalty computation, earnings view, financial persistence, payout, payment instruction, invoice, or dashboard financial value can begin in Tasks 17 or 18, an owner must explicitly accept every applicable row in the decision register and authorize that implementation task to use the accepted rule. An accepted rule must identify its effective date, source of authority, relationship inputs, calculation method, access boundary, and amendment path. <!-- authority: human-confirmed -->

## Explicit exclusions

This proposal does not choose any financial value or behavior. It does not calculate earnings, create a ledger, persist a live policy in application storage, issue a payout, send a payment instruction, expose a financial dashboard, mutate vendor payout cores, mutate B2B quote/order cores, mutate `TASK-ROYALTY-001` / `docs/royalty/*` / `TASK-PUBLISHER-001`, deploy, push, or merge.
