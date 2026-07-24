# Implementation plan

1. Persist organizations, memberships, selection lists, and B2bQuote records with closed statuses.
2. Institution APIs for lists and org-owned quotes (blind payloads).
3. B2B staff pipeline, quote detail click-through, status transitions, and optional unit prices.
4. Tests + `verify-b2b-quote-core.mjs`; wire into `npm run verify`.
