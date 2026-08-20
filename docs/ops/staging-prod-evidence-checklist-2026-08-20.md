# Staging / Production evidence checklist (operator)

**As of:** 2026-08-20  
**Task:** `TASK-UI-004`  
**Scope:** collect **sandbox** evidence only. Do **not** Production-deploy from this checklist. Do **not** flip live Stripe/PayPal keys (`DEC-PV3-001`).

## Preconditions

- [ ] Interim DECs on `main` (PR #35+) reviewed; no invented rates in ops notes
- [ ] Branch / release SHA recorded (`/api/ready` → `release.sha`)
- [ ] Target is **preview/staging** or documented sandbox Production project — never “go live” money
- [ ] `PAYPAL_MODE=sandbox`; Stripe secret does **not** start with `sk_live_`
- [ ] `COMMERCE_MUTATIONS_ENABLED` understood for the target env

## Evidence pack (copy results into ops run notes)

### 1. Probes

```bash
curl -sS "$BASE_URL/api/health"
curl -sS "$BASE_URL/api/ready"
```

Expect: liveness ok; ready `ok:true` only when DB/migration/env present; fingerprints include schema `public`, storage mode, release SHA. Secrets must not appear in JSON.

### 2. Auth + portals (operational)

- [ ] Login as seeded roles (customer, vendor, admin, employee, retail, b2b, institution, publisher, author)
- [ ] Each portal loads without inventing finance numbers
- [ ] Vendor/admin payout panels show **DEC-SET deferred** copy
- [ ] Publisher/author show **DEC-ROY deferred** / `policyPending`
- [ ] B2B/institution show **DEC-B2B deferred** Net-N note
- [ ] `GET /api/finance/policy` returns deferred SET/ROY/B2B snapshot

### 3. Commerce (sandbox interim COM)

- [ ] `POST /api/quote` → USD, tax 0, shipping 0, reservation metadata
- [ ] Checkout creates pending order with ~30m `expiresAt`
- [ ] Stripe/PayPal **sandbox** path only; refuse if live keys present
- [ ] Returns UX still deferred (DEC-RET) — support path only

### 4. Smoke scripts (optional on staging)

```bash
cd app/web
npm run smoke:production   # against BASE_URL if script supports it
```

Record stdout; unpaid checkout is the commerce proof until PV3 revises.

### 5. Explicitly out of this checklist

- Live `sk_live_` / `PAYPAL_MODE=live`
- Settlement commission % or royalty statements with rates
- US-region move, Supabase Auth cutover, `app` schema cutover, WP DNS
- Claiming `PKG-80` / `PKG-81` complete

## Sign-off

| Role | Name | Date | Notes |
| --- | --- | --- | --- |
| Operator | | | Sandbox evidence only |
| Reviewer | | | |

Attach: probe JSON, release SHA, screenshots of deferred finance banners, smoke log path.
