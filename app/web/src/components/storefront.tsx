"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { addCartItem, CART_KEY, formatUsd, normalizeCart } from "@/lib/portal-ui-core.mjs";
import { defaultHomeForRole, displayTier, displayTierLabel, formatRoleForDisplay } from "@/lib/access.mjs";
import { useLocale } from "@/components/locale-provider";
import { TourLauncher } from "@/components/tours/tour-provider";
import { MotionReveal } from "@/components/motion-reveal";

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: { slug: string; name: string };
  primaryOffer: null | { id: string; priceUsd: string; listPriceUsd?: string | null; stockQuantity: number };
};

type CategoryOption = { slug: string; name: string };

const COVER_TONES = [
  "from-[color-mix(in_oklab,var(--cs-accent-strong)_88%,#031018)] to-[color-mix(in_oklab,var(--cs-accent)_55%,#0a2a38)]",
  "from-[color-mix(in_oklab,var(--cs-accent)_75%,#04283a)] to-[color-mix(in_oklab,var(--cs-accent-strong)_40%,#0d3d4f)]",
  "from-[#0b3a4a] to-[color-mix(in_oklab,var(--cs-accent)_65%,#125566)]",
  "from-[#12364a] to-[color-mix(in_oklab,var(--cs-accent-strong)_50%,#1a5a6e)]",
];

function coverTone(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash + slug.charCodeAt(i) * (i + 3)) % COVER_TONES.length;
  return COVER_TONES[hash];
}

function apiMessage(body: Record<string, unknown>, fallback: string) {
  const error = body.error;
  if (error && typeof error === "object" && error !== null && "message" in error) return String((error as { message: string }).message);
  if (typeof error === "string") return error;
  return fallback;
}

function catalogItems(body: Record<string, unknown>): Product[] {
  if (Array.isArray(body.items)) return body.items as Product[];
  if (Array.isArray(body.products)) return body.products as Product[];
  return [];
}

function readCart() {
  try { return normalizeCart(JSON.parse(window.localStorage.getItem(CART_KEY) || "[]")); }
  catch { return []; }
}

function shelfBadgeLabel(loading: boolean, count: number, t: (key: string, vars?: Record<string, string | number>) => string) {
  if (loading) return t("storefront.shelfWarming");
  if (count > 0) return t("storefront.shelfCount", { count });
  return t("storefront.shelfEmpty");
}

type StorefrontProps = {
  initialProducts?: Product[];
  initialCategories?: CategoryOption[];
  initialHasMore?: boolean;
};

export function Storefront({
  initialProducts = [],
  initialCategories = [],
  initialHasMore = false,
}: StorefrontProps) {
  const { locale, setLocale, t } = useLocale();
  const catalogErrorFallback = useRef("Could not load the catalog.");
  useEffect(() => {
    catalogErrorFallback.current = t("storefront.catalogLoadError");
  }, [t]);

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [sessionUser, setSessionUser] = useState<null | { email: string; role: string }>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => typeof window === "undefined" ? 0 : readCart().reduce((sum, item) => sum + item.quantity, 0));
  const [addedId, setAddedId] = useState("");
  const pageSize = 24;
  const skipInitialFetch = useRef(initialProducts.length > 0 && !submittedQuery && !category);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchFieldId = useId();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog/categories", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !Array.isArray(body.categories)) return;
        setCategories(body.categories as CategoryOption[]);
      })
      .catch(() => { /* keep SSR / derived categories */ });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          setSessionUser(null);
          return;
        }
        const body = await response.json();
        if (body?.user?.email && body?.user?.role) {
          setSessionUser({ email: String(body.user.email), role: String(body.user.role) });
        } else {
          setSessionUser(null);
        }
      })
      .catch(() => setSessionUser(null))
      .finally(() => setSessionReady(true));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    function onPointerDown(event: MouseEvent | PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (submittedQuery) params.set("q", submittedQuery);
    if (category) params.set("category", category);
    params.set("limit", String(pageSize));
    setLoading(true);
    fetch(`/api/catalog/products?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        const items = catalogItems(body);
        if (!response.ok) throw new Error(apiMessage(body, catalogErrorFallback.current));
        setProducts(items);
        setHasMore(Boolean(body.nextCursor) || (!submittedQuery && items.length === pageSize));
      })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, submittedQuery]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSubmittedQuery(query.trim());
  }

  function addToCart(product: Product) {
    if (!product.primaryOffer) return;
    const next = addCartItem(readCart(), {
      vendorOfferId: product.primaryOffer.id,
      title: product.title,
      priceUsd: product.primaryOffer.priceUsd,
      quantity: 1,
      plasticCover: false,
      giftWrap: false,
    });
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
    setCartCount(next.reduce((sum, item) => sum + item.quantity, 0));
    setAddedId(product.id);
    window.setTimeout(() => setAddedId((current) => (current === product.id ? "" : current)), 1600);
  }

  async function loadMore() {
    if (loadingMore || !hasMore || submittedQuery || products.length === 0) return;
    setLoadingMore(true);
    setError("");
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("limit", String(pageSize));
    params.set("after", products[products.length - 1].id);
    try {
      const response = await fetch(`/api/catalog/products?${params}`);
      const body = await response.json();
      const items = catalogItems(body);
      if (!response.ok) throw new Error(apiMessage(body, catalogErrorFallback.current));
      setProducts((current) => [...current, ...items]);
      setHasMore(Boolean(body.nextCursor) || items.length === pageSize);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : catalogErrorFallback.current);
    } finally {
      setLoadingMore(false);
    }
  }

  function toggleLocale() {
    const next = locale === "en" ? "vi" : "en";
    setLocale(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    } catch { /* ignore */ }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    window.location.assign("/");
  }

  const portalHome = sessionUser ? defaultHomeForRole(sessionUser.role) : "/account";
  const accessLabel = displayTierLabel(sessionUser?.role ?? null, locale === "vi" ? "vi" : "en");
  const tier = displayTier(sessionUser?.role ?? null);
  const secondaryLinks = sessionUser
    ? ([
        { href: "/account", label: t("nav.account") },
        { href: "/wishlist", label: t("nav.wishlist") },
        { href: "/support", label: t("nav.support") },
        { href: "/ecom/orders", label: t("nav.orders") },
      ] as const)
    : ([{ href: "/support", label: t("nav.support") }] as const);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-[color-mix(in_oklab,var(--cs-color-surface-panel)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cs-color-accent-ochre,#f4ba17)]" data-tour="storefront-brand">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--cs-accent-strong)] to-[var(--cs-accent)] font-bold text-white shadow-[0_10px_30px_color-mix(in_oklab,var(--cs-accent)_35%,transparent)]" aria-hidden="true">SV</span>
            <span className="min-w-0">
              <strong className="block truncate text-lg tracking-tight">{t("common.brand")}</strong>
              <small className="hidden text-muted sm:block">{t("common.tagline")}</small>
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1.5 text-sm sm:gap-2" data-tour="storefront-nav">
            <Link className="cs-button cs-button--ghost hidden sm:inline-flex" href="/features">{t("nav.features")}</Link>
            <div className="relative hidden lg:flex lg:items-center lg:gap-1.5">
              {secondaryLinks.map((link) => (
                <Link key={link.href} className="cs-button cs-button--ghost" href={link.href}>{link.label}</Link>
              ))}
            </div>
            <div className="relative lg:hidden" ref={menuRef}>
              <button
                type="button"
                className="cs-button cs-button--ghost"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-controls="storefront-more-menu"
                aria-label={t("nav.moreMenu")}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {t("nav.moreMenu")}
              </button>
              {menuOpen ? (
                <div id="storefront-more-menu" role="menu" className="cs-surface-heavy absolute right-0 top-12 z-50 min-w-48 rounded-2xl p-2 shadow-xl">
                  <Link className="cs-button cs-button--ghost flex w-full justify-start sm:hidden" href="/features" role="menuitem" onClick={() => setMenuOpen(false)}>{t("nav.features")}</Link>
                  {secondaryLinks.map((link) => (
                    <Link key={link.href} className="cs-button cs-button--ghost flex w-full justify-start" href={link.href} role="menuitem" onClick={() => setMenuOpen(false)}>{link.label}</Link>
                  ))}
                </div>
              ) : null}
            </div>
            <Link className="cs-button cs-button--secondary" href="/ecom/cart">{t("nav.cart")} ({cartCount})</Link>
            <TourLauncher tourId="tour.storefront" />
            <a
              className="cs-button cs-button--ghost"
              href={`?lang=${locale === "en" ? "vi" : "en"}`}
              aria-label={t("common.language")}
              onClick={(event) => {
                event.preventDefault();
                toggleLocale();
              }}
            >
              {locale === "en" ? "VI" : "EN"}
            </a>
            {sessionReady && sessionUser ? (
              <>
                <span className="cs-badge hidden sm:inline-flex" data-access-tier={tier} title={formatRoleForDisplay(sessionUser.role, locale === "vi" ? "vi" : "en")}>
                  {accessLabel}
                </span>
                {portalHome !== "/account" ? (
                  <Link className="cs-button cs-button--ghost hidden sm:inline-flex" href={portalHome}>{t("nav.portal")}</Link>
                ) : null}
                <Link className="cs-button cs-button--ghost hidden sm:inline-flex" href="/account">{t("nav.account")}</Link>
                <button type="button" className="cs-button" onClick={logout}>{t("common.signOut")}</button>
              </>
            ) : sessionReady ? (
              <>
                <span className="cs-badge hidden sm:inline-flex" data-access-tier="guest">{t("common.roleGuest")}</span>
                <Link className="cs-button cs-button--ghost hidden sm:inline-flex" href="/register">{t("nav.register")}</Link>
                <Link className="cs-button" href="/login">{t("nav.login")}</Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklab,var(--cs-accent)_28%,transparent),transparent_55%),radial-gradient(ellipse_at_bottom_right,color-mix(in_oklab,var(--cs-accent-strong)_22%,transparent),transparent_50%),linear-gradient(180deg,color-mix(in_oklab,var(--cs-color-surface-page)_70%,#061821),var(--cs-color-surface-page))]" />
        <div className="cs-aurora-wash sv-aurora-live pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-24">
          <div>
            <p className="cs-eyebrow sv-motion-fade-up text-accent-strong">{t("storefront.eyebrow")}</p>
            <h1 className="sv-motion-fade-up sv-motion-delay-1 mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">{t("storefront.heroTitle")}</h1>
            <p className="sv-motion-fade-up sv-motion-delay-2 mt-5 max-w-2xl text-lg leading-8 text-muted">{t("storefront.heroBody")}</p>
            <form onSubmit={submitSearch} className="cs-surface-heavy sv-motion-fade-up sv-motion-delay-3 mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl p-3 shadow-[0_20px_60px_color-mix(in_oklab,var(--cs-accent)_18%,transparent)] sm:flex-row sm:items-end" data-tour="storefront-search">
              <div className="cs-field min-w-0 flex-1">
                <label className="cs-field__label" htmlFor={searchFieldId}>{t("storefront.searchLabel")}</label>
                <input id={searchFieldId} className="cs-field__control w-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("storefront.searchPlaceholder")} autoComplete="off" enterKeyHint="search" />
              </div>
              <button className="cs-button shrink-0 sm:mb-0.5" type="submit">{t("storefront.searchSubmit")}</button>
            </form>
            <div className="sv-motion-fade-up sv-motion-delay-4 mt-6 flex flex-wrap gap-3 text-sm text-muted">
              <span className="inline-flex min-h-9 items-center rounded-full border border-border bg-panel/70 px-3 py-1" aria-live="polite">{shelfBadgeLabel(loading, products.length, t)}</span>
              <a className="sv-chip-link" href="#catalog">{t("storefront.browseCatalog")}</a>
            </div>
          </div>
          <div className="relative hidden min-h-80 lg:block" aria-hidden="true">
            <div className="sv-float absolute inset-y-6 left-8 w-[42%] rounded-[1.4rem] bg-gradient-to-br from-[var(--cs-accent-strong)] to-[var(--cs-accent)] opacity-90 shadow-2xl" style={{ "--sv-tilt": "-6deg" } as CSSProperties} />
            <div className="sv-float-slow absolute inset-y-2 left-[28%] w-[46%] rounded-[1.4rem] bg-gradient-to-br from-[#0d4a5c] to-[var(--cs-accent)] shadow-2xl" style={{ "--sv-tilt": "3deg" } as CSSProperties} />
            <div className="cs-surface-heavy sv-motion-fade-up sv-motion-delay-2 absolute inset-y-0 right-0 flex w-[58%] flex-col justify-end rounded-[2rem] p-8 shadow-[0_30px_80px_color-mix(in_oklab,#000_25%,transparent)]">
              <p className="cs-eyebrow">{t("storefront.tipEyebrow")}</p>
              <p className="mt-3 text-2xl font-bold leading-snug">{t("storefront.tipBody")}</p>
              <Link className="cs-button cs-button--secondary mt-6 w-fit" href="/features">{t("storefront.seePlatformStatus")}</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="cs-eyebrow text-accent-strong">{t("storefront.catalogEyebrow")}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">{t("storefront.catalogTitle")}</h2>
          </div>
          <select aria-label={t("storefront.filterCategory")} className="cs-field__control min-w-48" value={category} onChange={(event) => { setLoading(true); setError(""); setCategory(event.target.value); }}>
            <option value="">{t("storefront.allCategories")}</option>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </div>

        {loading ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="cs-skeleton h-96 rounded-3xl" aria-hidden="true" />)}</div> : null}
        {error ? <div className="cs-alert cs-alert--danger mt-8" role="alert" tabIndex={-1}>{error}<button type="button" className="sv-text-link ml-3" onClick={() => { setLoading(true); setError(""); setSubmittedQuery((value) => `${value} `); }}>{t("common.retry")}</button></div> : null}
        {!loading && !error && products.length === 0 ? (
          <div className="cs-surface-standard mt-8 overflow-hidden rounded-3xl">
            <div className="border-b border-border bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--cs-accent)_22%,transparent),transparent_60%)] px-6 py-10 sm:px-10">
              <h3 className="text-2xl font-bold">{t("storefront.emptyTitle")}</h3>
              <p className="mt-3 max-w-xl text-muted">{t("storefront.emptyBody")}</p>
              <button type="button" className="cs-button cs-button--secondary mt-6" onClick={() => { setQuery(""); setSubmittedQuery(""); setCategory(""); }}>{t("storefront.viewAll")}</button>
            </div>
          </div>
        ) : null}
        {!loading && products.length ? (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <MotionReveal key={product.id} as="article" delayMs={Math.min(index, 8) * 55} className="cs-surface-standard sv-card-lift group flex min-h-[26rem] flex-col overflow-hidden rounded-3xl">
                  <div className={`sv-cover-sheen relative mx-4 mt-4 flex h-40 items-end overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white ${coverTone(product.slug)}`}>
                    <div className="absolute inset-y-0 left-0 w-2 bg-black/20" />
                    <div className="relative">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/70">{product.category.name}</p>
                      <p className="mt-2 max-w-[14ch] text-2xl font-extrabold leading-tight">{product.title.slice(0, 28)}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6 pt-5">
                    <h3 className="text-xl font-bold leading-snug">
                      <Link className="rounded-sm hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cs-color-accent-ochre,#f4ba17)]" href={`/products/${product.slug}`}>{product.title}</Link>
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{product.description}</p>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
                      <div>
                        {product.primaryOffer ? (
                          <>
                            <strong className="text-lg">{formatUsd(product.primaryOffer.priceUsd, locale)}</strong>
                            {product.primaryOffer.listPriceUsd ? <small className="ml-2 text-muted line-through">{formatUsd(product.primaryOffer.listPriceUsd, locale)}</small> : null}
                            <small className="block text-muted">{t("storefront.inStock", { count: product.primaryOffer.stockQuantity })}</small>
                          </>
                        ) : <span className="cs-badge">{t("storefront.outOfStock")}</span>}
                      </div>
                      <button type="button" className={`cs-button shrink-0 ${addedId === product.id ? "sv-added-pop" : ""}`} disabled={!product.primaryOffer} onClick={() => addToCart(product)}>
                        {addedId === product.id ? t("storefront.added") : t("storefront.addToCart")}
                      </button>
                    </div>
                  </div>
                </MotionReveal>
              ))}
            </div>
            {hasMore ? (
              <div className="mt-10 flex justify-center">
                <button className="cs-button cs-button--secondary" disabled={loadingMore} type="button" onClick={() => { void loadMore(); }}>
                  {loadingMore ? t("storefront.loadingMore") : t("storefront.loadMore")}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
