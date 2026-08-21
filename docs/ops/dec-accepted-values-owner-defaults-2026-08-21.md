# DEC Accepted values — interim owner defaults 2026-08-21

**Status:** **Interim owner defaults 2026-08-21** (revisable) — fills concrete fields previously deferred on 2026-08-20.  
**Prior interim:** [`dec-accepted-values-blocker-2026-08-20.md`](dec-accepted-values-blocker-2026-08-20.md) (PR [#35](https://github.com/cyberskill-official/sach-viet/pull/35), `5df30cd`)  
**Checklist:** [`next-dec-revisions-checklist-2026-08-21.md`](next-dec-revisions-checklist-2026-08-21.md)

## What changed (2026-08-21)

Owner-requested conservative marketplace defaults written into all ten `docs/decisions/DEC-*.md` Accepted tables (version stamp `interim-owner-defaults-2026-08-21`). Prior 2026-08-20 history kept in each DEC History section.

| DEC | Accepted summary | Unlocks | Still blocked |
| --- | --- | --- | --- |
| `DEC-COM-001` | USD; US+VN; address inventory; tax **0**; ship none/$0; carriers none; 30m TTL | Named scope for future address UX | Tax>0, carriers |
| `DEC-RET-001` | 14d defects; restock 0%; original-method refund; photo optional | Thin returns product | Live provider refunds (PV3) |
| `DEC-SET-001` | 15% commission; reserve 0; weekly; $50; manual/sandbox | Settlement compute | Live ACH |
| `DEC-ROY-001` | Author 10% net; quarterly; no advances; paid recognition | Royalty compute | Multi-party splits |
| `DEC-B2B-001` | Quote 30d; admin max 20%; Net-30; tax0/no-ship | Quote TTL / Net-N UX | Credit limit, late fee |
| `DEC-PUB-001` | draft→review→published; worldwide en+vi; terms TBD | Editorial stage machine | Terms URL, ISBN authority |
| `DEC-PV3-001` | **Sandbox only**; max live **not authorized** | — | **Live go** |
| `DEC-OPS-001` | APAC stay; `sv_session`; public schema; Storage postgres; WP refused | — | US / Auth / `app` / WP |
| `DEC-PRIV-001` | Orders 24m; logs 30d; export/deletion 30d SLA | TTL-based purge planning | Counsel final calendar |
| `DEC-COMMS-001` | SMTP keep; Zalo deferred; **no OA id** | — | Zalo OA |

## Engineering rules

- Implement **only** what Accepted values state.
- **Do not** flip live Stripe/PayPal, invent OA ids, tax tables, or carrier rate cards.
- Settlement/royalty modules must source rates from DEC-backed policy constants (version `interim-owner-defaults-2026-08-21`), not hard-coded ad-hoc %.

## Adjusted-plan gate

| Adjusted phase | Allowed under 2026-08-21 defaults? |
| --- | --- |
| 3 — returns thin product | **Yes** (RET filled); taxed retail / carriers still no |
| 4 — B2B Net-N / quote validity / PUB stages | **Yes** for filled fields |
| 5 — settlement / royalty compute | **Yes** at interim rates; live rails no |
| 7–9 — live PV3 | **No** until PV3 revised + operator deploy |
