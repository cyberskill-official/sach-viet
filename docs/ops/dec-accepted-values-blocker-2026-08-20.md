# DEC Accepted values blocker — 2026-08-20

**Status:** blocking  
**Scope:** all ten `docs/decisions/DEC-*.md` records  
**Effect:** Phase 2+ of the adjusted completion program (commerce, finance, returns, settlement, royalties, live pay, US-region ops exits) is **blocked** until owners fill concrete Accepted values in-repo (or an external signed source is copied into these files).

Engineers must **not** invent tax, shipping, commission, royalty, live-pay, discount, retention, or SLO numbers.

## Frontmatter vs body conflict

| Observation | Truth for engineering |
| --- | --- |
| YAML `status` on `main` is currently `unsigned` for every `DEC-*` | Treat records as **not ready to implement against**. |
| Bodies still say “Empty owner template” and **Accepted values: _None. Unsigned._** | Empty Accepted values are the blocker; status alone does not unlock work. |
| Some plan narratives / dirty working trees have flipped YAML to `status: signed` while leaving bodies empty | **Do not treat that as a signature.** Prefer documenting the conflict over silently changing `signed` ↔ `unsigned` / `draft` without operator text. This ops note is the interim source of truth. |

No DEC frontmatter was normalized in this change set. When owners fill Accepted values, they (or an explicit operator instruction) should set `status: signed` and complete the Authority table in the same edit.

## Per-DEC inventory (Accepted values empty)

| DEC id | Title | YAML status (`main`) | Accepted values | Blocks (from frontmatter / §24) |
| --- | --- | --- | --- | --- |
| `DEC-COM-001` | Commerce, tax, shipping, promotions, and reservation policy | `unsigned` | Empty (`_None. Unsigned._`) | `FL-B2C-06`…`12`, vendor/retail fulfillment; `PKG-21`/`22` tax-shipping quote path |
| `DEC-RET-001` | Returns, exchanges, restock, and refund allocation policy | `unsigned` | Empty | `FL-B2C-12`, `FL-VEN-07`, `FL-RET-04`, `FL-ADM-07` |
| `DEC-SET-001` | Vendor settlement, commission, and payout policy | `unsigned` | Empty | `FL-VEN-08`, `FL-ADM-08`, `PKG-31` |
| `DEC-ROY-001` | Royalty rates, splits, recognition, and statement policy | `unsigned` | Empty | `FL-PUB-07`…`08`, `FL-AUT-07`…`08`, `PKG-61` |
| `DEC-PUB-001` | Publishing editorial, rights, contract, and MARC policy | `unsigned` | Empty | `FL-PUB-05`…`06`, `FL-AUT-03`…`06` |
| `DEC-B2B-001` | B2B quote, contract, PO, invoice, and payment-terms policy | `unsigned` | Empty | `FL-B2B-03`…`09`, `FL-INS-04`…`09` |
| `DEC-COMMS-001` | Email provider, mandatory events, templates, and Zalo OA policy | `unsigned` | Empty | `FL-PLT-05`, transactional release gate (Resend sandbox wiring ≠ policy acceptance) |
| `DEC-PRIV-001` | Privacy jurisdictions, processors, consent, retention, and deletion policy | `unsigned` | Empty | `FL-PLT-08`…`11`, `FL-ID-08`…`09` |
| `DEC-OPS-001` | Release owners, rollback, on-call, availability, and cost limits | `unsigned` | Empty | Staging/production exit; `PKG-03` US-region move; PITR/on-call |
| `DEC-PV3-001` | Controlled live Stripe and PayPal verification | `unsigned` | Empty | Production live-payment verification; `PKG-81`/`82` live rails |

## Owner checklist before Phase 2+ commerce / finance

For **each** DEC above, owners must complete all of the following before dependent packages may turn flags on or ship rate-bearing logic:

1. **Authority table** — named Owner (and Commerce / Finance / Counsel / Ops / Privacy roles as listed in the DEC), dates, and signatures.
2. **Fields to accept** — every row in that DEC’s “Fields to accept” table has a concrete Accepted value (or an explicit “out of scope / N/A” with rationale). Leave no blank rate, window, threshold, or jurisdiction where the field is in scope.
3. **Accepted values section** — replace `_None. Unsigned._` with the versioned accepted text (or a dated pointer to an attached signed source copied into the repo).
4. **YAML status** — set `status: signed` only after steps 1–3 are true; never flip status alone.
5. **Dependent flags** — keep commerce/finance/returns/settlement/royalty/live-pay/Zalo flags off until the corresponding DEC’s Accepted values exist.
6. **No engineer fill** — implementation agents may assist with formatting and checklists only; they must not invent numbers.

### Field groups that must be filled (by DEC)

Use the tables already in each DEC file. Summary of what owners must supply (values blank until signed):

- **DEC-COM-001:** countries/states, address fields, tax source, shipping rates/carriers, delivery promises, add-on prices, promotions, cancellation window, reservation window.
- **DEC-RET-001:** return eligibility, evidence, labels, inspection, restock, refund allocation, timing, exchanges, damage/loss.
- **DEC-SET-001:** vendor eligibility, commission, provider fees, tax treatment, reserve, cadence, threshold, bank/rail, approvals, failed transfer, reversals, disputes.
- **DEC-ROY-001:** product/contract/recipient links, rates/splits, recognition, returns treatment, advances, reserves, periods, currency, tax, statements, payout, disputes.
- **DEC-PUB-001:** editorial stages, authority, revision/appeal, rights, territories, formats, terms, signatures, termination, ISBN/MARC, publication rollback.
- **DEC-B2B-001:** quote validity, discount authority, contract/PO fields, signatures, tax, shipping, invoice/credit terms, payment evidence, partial delivery, MARC license.
- **DEC-COMMS-001:** email provider/domain, reply-to, mandatory events, marketing consent, vi/en templates, retry/dead-letter, bounce/suppression, Zalo OA policy.
- **DEC-PRIV-001:** jurisdictions, processors, consent classes, retention by record type, export, deletion, anonymization, legal hold, moderation, audit access.
- **DEC-OPS-001:** release approver, migration operator, rollback authority, on-call owner, incident channel, availability target, traffic forecast, monthly cost limits (and US-region naming if/when required).
- **DEC-PV3-001:** maximum live test amount, controlled accounts, refund authority, accounting label, abort rule, Stripe reviewer, PayPal reviewer.

## Adjusted-plan gate

Canonical tracker: [`docs/plans/sachviet-adjusted-completion-tracker.md`](../plans/sachviet-adjusted-completion-tracker.md).

| Adjusted phase | Allowed while Accepted values empty? |
| --- | --- |
| 0 — CDS ocean + auth UI parity | Yes |
| 1 — Fill DEC Accepted values | Required owner work (this blocker) |
| 2+ — Foundations delta with Storage/Auth/`app` schema; B2C tax/shipping; portal API depth; settlement; royalties; live PV3; staging/prod exits | **No** until relevant DEC Accepted values are filled |

**Phase 2+ of the adjusted plan is blocked until Accepted values are filled.**
