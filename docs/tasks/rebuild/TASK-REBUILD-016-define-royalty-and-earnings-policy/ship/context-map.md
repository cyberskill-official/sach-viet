# Context map

Touched domain: greenfield royalty and earnings **policy definition** only (docs/decision artefacts). No royalty calculation, payout, or publisher/author financial product surface is implemented.

## Source inventory

- Vision: long-term self-publishing includes royalty tracking (`docs/01-vision.md:19-21`)
- Portals: publisher royalties/sales/contracts mocked; author earnings mocked (`docs/03-portals.md:52-58`)
- Tech stack / roadmap: royalty and earnings model is an owner product decision that unblocks publisher and author portals (`docs/06-tech-stack.md:43-50`; `docs/07-status-roadmap.md:20-36`)

## Greenfield reservations (not a shipped financial product)

- `app/web/src/lib/access.mjs` — `publisher` and `author` roles; portal ACL entries
- `app/web/src/lib/web-foundations.mjs` — publisher purple / author orange accents
- `app/web/src/proxy.ts` — `/publisher/:path*` and `/author/:path*` matchers

## Explicitly untouched / absent

- No `app/web/src/app/api/publisher/**` or `app/web/src/app/api/author/**`
- No royalty-core or earnings-core modules
- `TASK-ROYALTY-001` remains `done` (unchanged); `docs/royalty/*` unchanged
- `TASK-PUBLISHER-001` remains `on_hold`
- Vendor payout cores and B2B quote/order cores left intact
- Notification + SSE live stream from Tasks 10–11 left intact
