# 04 — Roles & Permissions

> **Archived handoff context — not current implementation truth.** The Sanctum, Nuxt proxy, middleware, and route details below belong to the superseded Nuxt/Laravel handoff. The active authorization implementation is in the Next.js application under `app/web`. Use `docs/07-status-roadmap.md` for current scope/status and `app/web/OPERATIONS.md` for operational guidance.

## Model

**Single-role system**: one `role` string column on `users` (default `customer`). Check via `User::hasAnyRole([...])`. No permission matrix / no spatie-style abilities — role = capability bundle. Keep it this way unless a real need emerges (discuss first).

## Role tree

```
users.role
│
├── customer                    ← default on registration; shops on /ecom
│
├── EXTERNAL PARTNERS
│   ├── vendor                  ← marketplace seller (approved by admin from application queue)
│   ├── publisher               ← publishing house
│   ├── author                  ← self-publishing author
│   └── school_librarian        ← institutional buyer (library/school)
│
├── INTERNAL STAFF
│   ├── employee                ← generic staff
│   ├── employee_b2c            ← retail ops staff  → /retail
│   ├── employee_b2b            ← institutional sales staff → /b2b
│   └── employee_supplier       ← supplier liaison (placeholder — portal not built)
│
└── SUPERUSER
    ├── admin                   ← allowed EVERYWHERE (every guard whitelists admin)
    └── super_admin             ← referenced in employee middleware only; treat as admin
```

## Frontend route guards (`web/middleware/`)

| Middleware | Protects | Allowed roles | Fail redirect |
|---|---|---|---|
| `auth.ts` | any authed page | any authenticated | `/ecom/login?redirect=…` |
| `admin.ts` | `/admin/*` | admin | `/admin/login` |
| `vendor.ts` | `/vendor/*` | vendor, admin | `/vendor/login` |
| `publisher.ts` | `/publisher/*` | publisher, admin | `/publisher/login` |
| `author.ts` | `/author/*` | author, admin | `/author/login` |
| `institution.ts` | `/institution/*` | school_librarian, admin | `/institution/login` |
| `employee.ts` | `/employee/*` | admin, super_admin, employee, employee_b2c, employee_b2b | `/employee/login` |
| `retail.ts` | `/retail/*` | employee_b2c, admin | `/employee/login` |
| `b2b.ts` | `/b2b/*` | employee_b2b, admin | `/employee/login` |
| `supplier.ts` | (legacy) | employee_supplier, admin | `/portal/login` (old pattern — tech debt) |

All portal routes render CSR-only (`ssr: false`) because auth state reads localStorage. Each middleware skips its own login route.

## API route guards (`api/routes/api.php`)

```
POST /login                     throttle:login (per-EMAIL, not per-IP)
/admin/*        auth:sanctum + role:admin
/vendor/*       auth:sanctum + role:vendor,admin
/publisher/*    auth:sanctum + role:publisher,admin
/author/*       auth:sanctum + role:author,admin
/institution/*  auth:sanctum + role:school_librarian,admin
/retail/*       auth:sanctum + role:employee_b2c,admin
/b2b/*          auth:sanctum + role:employee_b2b,admin
/supplier/*     auth:sanctum + role:employee_supplier,admin   (placeholder)
/products       public read; writes scoped by role
/internal/*     HMAC via INTERNAL_API_KEY (no session) — maintenance/automation endpoints
```

Plus **Policies** for record-level ownership (`SupportTicketPolicy`, `GoodsRequestPolicy`): a customer sees only their own tickets; staff see queue-wide.

## Auth flow (important — non-standard and deliberate)

1. `POST /login` → Laravel Sanctum issues a bearer token.
2. **Nuxt server proxy intercepts the response** and sets the token into an **httpOnly cookie `sv_auth`** — the browser JS never sees the token (XSS-hardened).
3. Subsequent calls go browser → Nuxt proxy (`/api/*`) → proxy reads cookie, injects `Authorization: Bearer` → Laravel.
4. Frontend keeps a lightweight `user` object in localStorage for UI state; 401 anywhere = auto-logout.
5. Legacy WP users authenticate via WordPress PHPass hash compatibility (imported accounts keep their passwords).

## Security posture already in place (don't regress)

- Per-email login throttling; review spam throttle + keyword blocklist
- httpOnly token cookie (no token in JS)
- HMAC-keyed internal API for automation (AI/ops) without admin sessions
- Support ticket 8-layer access model (role + policy + ownership + status gates)
- Audit log on sensitive mutations

## Test accounts

One seeded account per role — see `app/misc/TEST_ACCOUNTS*` and migration `2026_04_14_120000_seed_test_accounts.php` (emails like `admin@sachviet.us`, `b2b@sachviet.us`; passwords in the TEST_ACCOUNTS file, not here).
