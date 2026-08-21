# Sandbox PV3 + Production smoke evidence (2026-08-21)

**Actor:** agent (operator continue after HITL)  
**Recorded:** 2026-08-21  
**Scope:** sandbox-only; no live keys; no deploy.

## `npm run evidence:sandbox-pv3` (`app/web`)

### Without `BASE_URL`

```json
{
  "ok": true,
  "mode": "sandbox_only",
  "dec": "DEC-PV3-001",
  "version": "interim-owner-defaults-2026-08-21b",
  "liveAuthorized": false,
  "baseUrl": null,
  "checks": [
    { "path": "/api/health", "skipped": true, "reason": "BASE_URL unset" },
    { "path": "/api/ready", "skipped": true, "reason": "BASE_URL unset" }
  ]
}
```

Exit 0. Live-key refuse path not triggered (no live secrets in env).

### With Production `BASE_URL`

```bash
BASE_URL=https://sachviet.cyberskill.world npm run evidence:sandbox-pv3
```

Result: `ok: true`, `/api/health` and `/api/ready` both HTTP 200, `releaseSha` `3db9d865737d89dde21aa3b4f31cdad767edd101` (PR #43 merge). Still `liveAuthorized: false`.

## Production smoke (sandbox posture)

```bash
BASE_URL=https://sachviet.cyberskill.world npm run smoke:production
```

| Check | Result |
| --- | --- |
| health-postgres | PASS |
| catalog-list | PASS (count=1) |
| admin-login | FAIL / skipped — bootstrap admin credentials not in this session env |
| checkout-pending-path | PASS (401 unauthenticated) |

Process exit **1** (hard-fail on skipped `admin-login`). No live Stripe/PayPal exercised.

## Still blocked (unchanged)

- Live PV3 / live keys
- Tax > 0 / physical carriers
- Zalo OA id
- Auth / `app` schema / US-region / WP DNS cutovers
