# Production UX audit — Sách Việt

**Date:** 2026-08-21  
**Target:** https://sachviet.cyberskill.world (Production, read-only)  
**Release (at audit):** `/api/ready` → `ok`, migration `008_user_tour_progress`, SHA `f2be0c0de4b085f84d7e5abcefdc0c63f9988410`  
**Remediation deployed:** 2026-08-21 — PR #47 merged (`6e01b91`); Vercel Production `dpl_Bar3oD8EUsvmZVwPTzNXyjwZDAMB` Ready → `https://sachviet.cyberskill.world` (`/api/ready` SHA `6e01b91`, CSP `script-src 'self' 'unsafe-inline'` with no theme hash, catalog products 200)  
**Branch audited against:** `main` (workspace)  
**Method:** Playwright (`/tmp/sachviet-prod-audit.mjs` → `/tmp/sachviet-prod-audit-out.json`), Chrome DevTools MCP, curl API probes  
**Screenshots:** `/tmp/sachviet-audit-shots/`

---

## Executive summary

Production storefront is **functionally broken for interactive browsing** because the Content-Security-Policy header pairs `'unsafe-inline'` with a **theme-script SHA-256 hash**. Per CSP Level 2+, a hash/nonce causes browsers to **ignore `'unsafe-inline'`**, so Next.js App Router RSC flight inline scripts (`self.__next_f.push(...)`) are blocked. React never hydrates (`__reactFiber` absent), `/api/catalog/products` is never requested from the page, the hero stays on **“Warming the shelf…”**, catalog skeletons never clear, search/locale/tour clicks are inert, and client-only auth shells (account / wishlist / orders) render forms without a login redirect.

Backend health is fine: `/api/ready` and `/api/catalog/products` return 200 with seeded titles (~1.3–3.2s). Role portals correctly 307 to login. Cart empty state SSR is clear. Navbar overcrowding (Sign in wrapped under Features) is a real layout defect at all tested viewports.

**UI/UX score: 3.5 / 10** — visual shell and Features catalog content are polished, but the CSP hydration failure makes core B2C discovery unusable; that outweighs secondary layout issues.

---

## Tested pages / flows

| Area | Routes / actions | Result |
| --- | --- | --- |
| Home | `/` @ 1440×900, 768×1024, 390×844 | Hydration fail; warming + skeletons; nav wrap |
| Features | `/features` | Contentful AVAILABLE / RESTRICTED / UPCOMING + tour index (SSR OK) |
| Auth UI | `/login`, `/register`, `/forgot`, `/reset` | Forms present; invalid email → `:invalid` on login; **register not submitted** (non-destructive) |
| B2C shells | `/account`, `/wishlist`, `/support`, `/ecom/cart`, `/ecom/orders`, `/ecom` | Cart empty OK; account/wishlist/orders **no server redirect** for anon |
| Portals | `/vendor`, `/admin`, `/employee`, `/retail`, `/b2b`, `/institution`, `/publisher`, `/author` | 307 → `/login?redirect=…` |
| Supplier | `/supplier` | **410** JSON `{ error: "Supplier portal is retired." }` (intentional) |
| Misc | `/forbidden` | 200 |
| Search | Query `Kiều` via UI | No client results (hydration); API search returns `Truyện Kiều` |
| Locale | EN↔VI toggle | No copy change without hydration |
| Tour | Take a tour | Click does not open overlay without hydration |
| APIs | `/api/ready`, `/api/health`, `/api/catalog/products`, suggestions | All 200 |
| Keyboard | Tab ×8 on home | Focus moves across links/controls in DOM order |

---

## Issues by severity

**Unique issues (deduped):** Critical **2**, High **4**, Medium **4**, Low **1**  
(Playwright JSON may count Critical/High once per viewport — treat viewport repeats as evidence, not separate bugs.)

### Critical

#### C1 — CSP hash disables `'unsafe-inline'` → RSC blocked → no hydration

| Field | Detail |
| --- | --- |
| **Severity** | Critical |
| **Page/flow** | Site-wide (observed on `/`) |
| **Steps** | Open Production home; check console + network; wait 6–15s |
| **Expected** | React hydrates; client fetches catalog; interactive controls work |
| **Actual** | Console: CSP blocks inline scripts (×6); `Uncaught (in promise)` in `createFromReadableStream`; **zero** `/api/catalog/products` requests; `fiber=false`; warming + 6 skeletons forever |
| **Evidence** | `/tmp/sachviet-prod-audit-out.json` (`home_desktop`, `cspHeader`, `cspViolations`); Chrome DevTools network (static only); header from `next.config.ts` `script-src 'self' 'unsafe-inline' 'sha256-…'` |
| **Recommended fix** | In `app/web/next.config.ts`: **remove the theme SHA from `script-src`** (keep `'unsafe-inline'` only for interim), **or** move to **nonce-based CSP** via middleware (Next.js recommended) and hash/nonce the theme boot in `layout.tsx`. Redeploy Production. Verify console has no CSP script blocks and catalog requests fire. |

#### C2 — Catalog stuck on “Warming the shelf…” / empty interactive shelf

| Field | Detail |
| --- | --- |
| **Severity** | Critical (symptom of C1; also UX copy race once fixed) |
| **Page/flow** | `/` hero + catalog |
| **Steps** | Load `/`; observe badge + “Books available now” + skeletons |
| **Expected** | Loading state then product cards; badge shows shelf count |
| **Actual** | Badge stays warming; skeletons persist; categories = only “All categories”; API itself healthy (11 items, cats present) |
| **Evidence** | Screenshots `*-catalog-warming.png`, `*-home.png`; curl `GET /api/catalog/products?limit=24` → 200 |
| **Recommended fix** | Ship C1 first. Then in `app/web/src/components/storefront.tsx`: (1) treat warming as **loading-only** (`loading ? warming : count/empty`); (2) remove `t` from catalog `useEffect` deps (use stable locale/message for errors); (3) optionally SSR/prefetch first page to avoid 1–3s empty shelf. |

### High

#### H1 — Sticky header overcrowded; Sign in wraps under Features

| Field | Detail |
| --- | --- |
| **Severity** | High |
| **Page/flow** | `/` sticky header (all viewports) |
| **Steps** | View header at 1440 / 768 / 390 |
| **Expected** | One coherent row or hamburger / overflow menu |
| **Actual** | `flex-wrap` nav: Sign in y below Features; header height ~129 (desktop) / 193 (tablet) / 297 (mobile); **no** menu button |
| **Evidence** | `desktop-navbar-wrap.png`, `tablet-navbar-wrap.png`, `mobile-navbar-wrap.png`; code `storefront.tsx` nav links |
| **Recommended fix** | Collapse secondary links (Account, Wishlist, Support, Orders) into a compact menu below `lg`; keep Cart + Sign in + locale on primary row; or split brand/nav into two rows intentionally with clear hierarchy. |

#### H2 — Locale toggle inert

| Field | Detail |
| --- | --- |
| **Severity** | High |
| **Page/flow** | `/` language button |
| **Steps** | Click VI/EN |
| **Expected** | Headline and chrome switch EN↔VI |
| **Actual** | H1 unchanged (no hydration) |
| **Evidence** | Playwright `metrics.locale`; depends on C1 |
| **Recommended fix** | Fix C1; retest. Optionally set `?lang=` / cookie via full navigation for no-JS fallback. |

#### H3 — Client search inert (API works)

| Field | Detail |
| --- | --- |
| **Severity** | High |
| **Page/flow** | Home search “Kiều” |
| **Steps** | Type Kiều → Search books |
| **Expected** | Results including Truyện Kiều or empty state |
| **Actual** | UI unchanged / still warming; `GET /api/catalog/products?q=…` never from page |
| **Evidence** | `desktop-search-kieu.png`; curl search → 1 item `Truyện Kiều` |
| **Recommended fix** | C1; after fix, confirm FTS path. |

#### H4 — Anon account / wishlist / orders lack server auth gate

| Field | Detail |
| --- | --- |
| **Severity** | High |
| **Page/flow** | `/account`, `/wishlist`, `/ecom/orders` as anonymous |
| **Steps** | Open routes without session |
| **Expected** | Redirect to `/login?redirect=…` (like portals) |
| **Actual** | HTTP 200; account shows **Add address** form; wishlist/orders shells without login wall (client gate dead under C1) |
| **Evidence** | Chrome snapshot `/account`; curl SSR snippets; Playwright gates |
| **Recommended fix** | Extend `app/web/src/proxy.ts` (or route handlers) to redirect unauthenticated B2C private pages the same way as portals; keep API auth as second line. |

### Medium

#### M1 — Category filter only “All categories”

| Field | Detail |
| --- | --- |
| **Severity** | Medium |
| **Page/flow** | `/` category `<select>` |
| **Steps** | Inspect filter after load |
| **Expected** | Options from catalog categories when products exist |
| **Actual** | Single option (categories derived from `products` which never load) |
| **Evidence** | a11y combobox; `storefront.tsx` `useMemo` from products |
| **Recommended fix** | C1; optionally dedicated `/api/catalog/categories` so filter populates independently. |

#### M2 — Features link appears multiple times in first viewport

| Field | Detail |
| --- | --- |
| **Severity** | Medium / Low visual noise |
| **Page/flow** | `/` |
| **Steps** | Count “Features” affordances |
| **Expected** | One primary nav Features; chips use distinct CTAs if needed |
| **Actual** | Nav + hero chip + tip card button (3) |
| **Evidence** | Screenshots; operator a11y note |
| **Recommended fix** | Tip card → “See platform status” / “Tour features”; remove redundant hero chip or retarget to `#catalog`. |

#### M3 — Catalog API latency (1.3–3.2s)

| Field | Detail |
| --- | --- |
| **Severity** | Medium |
| **Page/flow** | `GET /api/catalog/products` |
| **Steps** | curl timed probes |
| **Expected** | Sub-second list for 24 items on warm DB |
| **Actual** | Observed ~1.3–3.2s |
| **Evidence** | curl timings in audit session |
| **Recommended fix** | Index/query review; edge caching for anonymous catalog; SSR first page. |

#### M4 — `/supplier` returns raw 410 JSON

| Field | Detail |
| --- | --- |
| **Severity** | Medium (intentional retirement, rough UX) |
| **Page/flow** | `/supplier` |
| **Steps** | Open as anon |
| **Expected** | Branded retired page or redirect to Features |
| **Actual** | `410` JSON body |
| **Evidence** | curl; `proxy.ts` retirement |
| **Recommended fix** | HTML retired page under ocean chrome. |

### Low

#### L1 — Duplicate Features naming in a11y tree

Documented under M2; kept Low once nav is cleaned.

---

## Desktop vs mobile

| Topic | Desktop 1440 | Tablet 768 | Mobile 390 |
| --- | --- | --- | --- |
| CSP / hydration | Broken | Broken | Broken |
| Nav wrap | Sign in under Features; header ~129px | Worse (~193px) | Severe (~297px); no hamburger |
| Catalog | Warming + skeletons | Same | Same |
| Features page | Readable SSR | Not fully re-shot; same CSP | Same |

---

## UI/UX score: **3.5 / 10**

| Factor | Weight | Notes |
| --- | --- | --- |
| Visual system (Thủy · ocean) | + | Cohesive branding, Features page clarity |
| Core storefront job (find books) | −−− | Completely blocked without hydration |
| Trust / auth gates | −− | Portals OK; B2C private pages leak shells |
| Nav IA | −− | Overcrowded sticky bar |
| Empty / loading honesty | − | Contradictory “available now” + warming |

After C1 + H1 + H4, a re-score in the **7–8** range is plausible if catalog and i18n work.

---

## Top 5 fixes (priority order)

1. **Fix CSP** (`next.config.ts` / nonce middleware) so RSC inline scripts run — unblock hydration site-wide.  
2. **Harden storefront loading UX** (`storefront.tsx`) — warming only while `loading`; stable effect deps; optional SSR.  
3. **Server-gate** `/account`, `/wishlist`, `/ecom/orders` like portals (`proxy.ts`).  
4. **Responsive nav** — overflow/hamburger; stop Sign-in wrap.  
5. **Speed + categories** — catalog latency; independent category list; Features CTA de-dupe.

---

## Untested / out of scope

- Authenticated buyer checkout, sandbox Stripe/PayPal end-to-end (would create orders / charge paths)  
- Real registration / forgot-password email send (UI only; no account creation)  
- Authenticated portal depth (vendor/admin data mutations)  
- Accessibility audit beyond brief Tab + snapshots  
- Load / Lighthouse CI budget  
- Visual regression vs design tokens under dark theme  
- WordPress cutover / live PV3 (blocked by DEC)

---

## Non-destructive notes

- Register: form fields inspected; **submit not performed**.  
- Forgot: invalid email interaction only (no verified spam campaign).  
- Login: one invalid-email validation attempt.  
- No seed scripts, password resets storms, or Production data writes.

---

## Artifact index

| Artifact | Path |
| --- | --- |
| Playwright JSON | `/tmp/sachviet-prod-audit-out.json` |
| Playwright script | `/tmp/sachviet-prod-audit.mjs` |
| Screenshots | `/tmp/sachviet-audit-shots/*.png` |
| Code suspects | `app/web/next.config.ts`, `app/web/src/components/storefront.tsx`, `app/web/src/proxy.ts`, `app/web/src/app/layout.tsx` (theme boot) |

---

## Remediation (2026-08-21, branch `fix/prod-ux-audit-findings`)

Code fixes landed locally. **Production still shows C1 until an operator deploys** this branch (or a merge to the Production deploy path). Do not claim live UX cleared without a post-deploy re-probe.

| ID | Status | What changed |
| --- | --- | --- |
| **C1** | Fixed in code | Removed theme SHA from `script-src` in `app/web/next.config.ts`. Interim policy is `script-src 'self' 'unsafe-inline'` only so RSC flight scripts hydrate. Theme/locale boot in `layout.tsx` stays inline (documented). |
| **C2** | Fixed in code | `storefront.tsx`: warming badge only while `loading`; empty/count labels after load; catalog `useEffect` deps no longer include `t`; SSR first page via `app/page.tsx`. |
| **H1** | Fixed in code | Primary row keeps brand + Features (sm+) + Cart + locale + auth; Account/Wishlist/Support/Orders collapse into a **More** overflow menu below `lg`. |
| **H2** | Fixed (depends on deploy) | Locale `<a href="?lang=">` + `history.replaceState`; server `initialLocale` from cookie in `layout.tsx`. Verify after C1 deploy. |
| **H3** | Fixed (depends on deploy) | Unblocked by C1 + client search unchanged; confirm FTS after deploy. |
| **H4** | Fixed in code | `requiresAuthPath` + `proxy.ts` matcher for `/account`, `/wishlist`, `/ecom/orders` → `/login?redirect=…`. |
| **M1** | Fixed in code | Public `GET /api/catalog/categories` + storefront loads categories independently of products. |
| **M2** / **L1** | Fixed in code | Hero chip → `#catalog` (“Browse the catalog”); tip CTA → “See platform status”; nav keeps single Features. |
| **M3** | Partial / code | `Cache-Control: public, s-maxage=30, stale-while-revalidate=120` on public catalog list/categories; SSR prefetch first page. **Verify after deploy** for live latency. Deep index/query tuning deferred. |
| **M4** | Fixed in code | HTML Accept on `/supplier` redirects to branded `/gone/supplier`; API clients still get `410` JSON. |

### Verify after deploy (operator)

- Home console: no CSP script blocks; catalog XHR fires; hydration present.
- Locale VI/EN + search “Kiều”.
- Anon curl/browser: `/account`, `/wishlist`, `/ecom/orders` → 307 login.
- `/supplier` browser → ocean retired page; `Accept: application/json` → 410.
- Catalog TTFB / cache headers on warm CDN.

### Deferred (not code-fixable here)

- Live payment / authenticated checkout DEC paths.
- Creating real accounts or register submit.
- Full a11y / Lighthouse budgets.
- Nonce-based CSP migration (follow-up hardening; interim unsafe-inline is intentional).
