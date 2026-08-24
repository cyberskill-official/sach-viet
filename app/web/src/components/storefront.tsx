"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  BookOpen,
  Crown,
  Heart,
  List,
  MagnifyingGlass,
  SealCheck,
  ShoppingBag,
  Sparkle,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { addCartItem, CART_KEY, formatUsd, normalizeCart } from "@/lib/portal-ui-core.mjs";
import { displayTier, displayTierLabel, formatRoleForDisplay, portalNavHrefForRole } from "@/lib/access.mjs";
import { useLocale } from "@/components/locale-provider";
import { TourLauncher } from "@/components/tours/tour-provider";
import { MotionReveal } from "@/components/motion-reveal";
import { ProductCover } from "@/components/product-cover";
import type { ProductMedia } from "@/lib/product-cover";

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: { slug: string; name: string };
  media?: ProductMedia[];
  primaryOffer: null | { id: string; priceUsd: string; listPriceUsd?: string | null; stockQuantity: number };
};

type CategoryOption = { slug: string; name: string };

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
  if (count === 1) return t("storefront.shelfCountOne", { count });
  if (count > 0) return t("storefront.shelfCount", { count });
  return t("storefront.shelfEmpty");
}

/** Hide known Day-2 seed/demo titles from the public shelf when present. */
function isDemoShelfJunk(product: Product) {
  return /day[\s-]*2\s*demo/i.test(product.title) || /sách việt day[\s-]*2/i.test(product.title);
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

  const portalHome = sessionUser ? portalNavHrefForRole(sessionUser.role) : null;
  const accessLabel = displayTierLabel(sessionUser?.role ?? null, locale === "vi" ? "vi" : "en");
  const tier = displayTier(sessionUser?.role ?? null);
  const shelfProducts = products.filter((product) => !isDemoShelfJunk(product));
  const featuredProducts = shelfProducts.slice(0, 3);
  const brandValues = [
    { icon: Sparkle, titleKey: "storefront.valueCuratedTitle", bodyKey: "storefront.valueCuratedBody" },
    { icon: SealCheck, titleKey: "storefront.valueAuthenticTitle", bodyKey: "storefront.valueAuthenticBody" },
    { icon: Heart, titleKey: "storefront.valueServiceTitle", bodyKey: "storefront.valueServiceBody" },
    { icon: UsersThree, titleKey: "storefront.valueCommunityTitle", bodyKey: "storefront.valueCommunityBody" },
  ] as const;
  const secondaryLinks = sessionUser
    ? ([
        { href: "/features", label: t("nav.features") },
        { href: "/account", label: t("nav.account") },
        { href: "/wishlist", label: t("nav.wishlist") },
        { href: "/support", label: t("nav.support") },
        { href: "/ecom/orders", label: t("nav.orders") },
      ] as const)
    : ([
        { href: "/features", label: t("nav.features") },
        { href: "/support", label: t("nav.support") },
      ] as const);

  return (
    <main className="sv-luxury min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 sv-glass-heavy">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sv-lux-gold-soft,#ca8a04)]" data-tour="storefront-brand">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--sv-lux-stone-900)] to-[var(--sv-lux-gold-strong)] text-white shadow-[0_10px_30px_color-mix(in_oklab,var(--sv-lux-gold)_28%,transparent)]" aria-hidden="true">
              <Crown size={22} weight="duotone" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <strong className="sv-font-display block truncate text-xl tracking-tight">{t("common.brand")}</strong>
              <small className="hidden text-xs tracking-[0.14em] text-muted uppercase sm:block">{t("common.tagline")}</small>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2" data-tour="storefront-nav">
            <nav className="hidden items-center gap-1.5 text-sm lg:flex" aria-label={t("common.navigation")}>
              {secondaryLinks.map((link) => (
                <Link key={link.href} className="cs-button cs-button--ghost min-h-11" href={link.href}>{link.label}</Link>
              ))}
            </nav>
            <Link className="cs-button cs-button--secondary inline-flex min-h-11 min-w-11 items-center justify-center gap-2" href="/ecom/cart" aria-label={`${t("nav.cart")} (${cartCount})`}>
              <ShoppingBag size={18} weight="regular" aria-hidden="true" />
              <span className="hidden sm:inline">{t("nav.cart")}</span>
              <span className="hidden sm:inline" aria-hidden="true">({cartCount})</span>
            </Link>
            <div className="hidden sm:block">
              <TourLauncher tourId="tour.storefront" />
            </div>
            <a
              className="cs-button cs-button--ghost sv-header-desktop-only min-h-11 min-w-11 sm:inline-flex sm:items-center sm:justify-center"
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
                <span className="cs-badge sv-header-desktop-only sm:inline-flex" data-access-tier={tier} title={formatRoleForDisplay(sessionUser.role, locale === "vi" ? "vi" : "en")}>
                  {accessLabel}
                </span>
                {portalHome ? (
                  <Link className="cs-button cs-button--ghost sv-header-desktop-only sm:inline-flex" href={portalHome}>{t("nav.portal")}</Link>
                ) : null}
                <Link className="cs-button cs-button--ghost sv-header-desktop-only sm:inline-flex" href="/account">{t("nav.account")}</Link>
                <button type="button" className="cs-button sv-header-desktop-only min-h-11 sm:inline-flex" onClick={logout}>{t("common.signOut")}</button>
              </>
            ) : sessionReady ? (
              <>
                <span className="cs-badge sv-header-desktop-only sm:inline-flex" data-access-tier="guest">{t("common.roleGuest")}</span>
                <Link className="cs-button cs-button--ghost sv-header-desktop-only sm:inline-flex" href="/register">{t("nav.register")}</Link>
                <Link className="cs-button sv-header-desktop-only min-h-11 sm:inline-flex" href="/login">{t("nav.login")}</Link>
              </>
            ) : null}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="cs-button cs-button--ghost inline-flex min-h-11 min-w-11 items-center justify-center lg:hidden"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-controls="storefront-more-menu"
                aria-label={menuOpen ? t("common.hideNavigation") : t("common.showNavigation")}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X size={22} weight="bold" aria-hidden="true" /> : <List size={22} weight="bold" aria-hidden="true" />}
              </button>
              {menuOpen ? (
                <div id="storefront-more-menu" role="menu" className="sv-glass-heavy absolute right-0 top-12 z-50 max-h-[min(70vh,28rem)] w-[min(18rem,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl p-2 shadow-xl lg:hidden">
                  {secondaryLinks.map((link) => (
                    <Link key={link.href} className="cs-button cs-button--ghost flex min-h-11 w-full justify-start" href={link.href} role="menuitem" onClick={() => setMenuOpen(false)}>{link.label}</Link>
                  ))}
                  <div className="px-1 py-1 sm:hidden" role="none">
                    <TourLauncher tourId="tour.storefront" className="cs-button cs-button--ghost flex min-h-11 w-full justify-start" />
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className="cs-button cs-button--ghost flex min-h-11 w-full justify-start sm:hidden"
                    aria-label={t("common.language")}
                    onClick={() => {
                      toggleLocale();
                      setMenuOpen(false);
                    }}
                  >
                    {locale === "en" ? "VI" : "EN"}
                  </button>
                  {sessionReady && sessionUser ? (
                    <>
                      {portalHome ? (
                        <Link className="cs-button cs-button--ghost flex min-h-11 w-full justify-start" href={portalHome} role="menuitem" onClick={() => setMenuOpen(false)}>{t("nav.portal")}</Link>
                      ) : null}
                      <button type="button" role="menuitem" className="cs-button cs-button--ghost flex min-h-11 w-full justify-start sm:hidden" onClick={() => { setMenuOpen(false); void logout(); }}>{t("common.signOut")}</button>
                    </>
                  ) : sessionReady ? (
                    <>
                      <Link className="cs-button cs-button--ghost flex min-h-11 w-full justify-start" href="/register" role="menuitem" onClick={() => setMenuOpen(false)}>{t("nav.register")}</Link>
                      <Link className="cs-button flex min-h-11 w-full justify-start sm:hidden" href="/login" role="menuitem" onClick={() => setMenuOpen(false)}>{t("nav.login")}</Link>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/70 sv-lux-hero-glow">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="sv-aurora-live absolute -left-24 top-0 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--sv-lux-gold)_18%,transparent)] blur-3xl" />
          <div className="sv-aurora-live absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[color-mix(in_oklab,var(--sv-lux-stone-900)_14%,transparent)] blur-3xl" style={{ animationDelay: "-4s" } as CSSProperties} />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <p className="sv-lux-eyebrow sv-motion-fade-up">{t("storefront.eyebrow")}</p>
            <h1 className="sv-font-display sv-motion-fade-up sv-motion-delay-1 mt-5 max-w-3xl text-4xl leading-[1.06] tracking-tight text-balance sm:text-5xl lg:text-6xl">{t("storefront.heroTitle")}</h1>
            <p className="sv-motion-fade-up sv-motion-delay-2 mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">{t("storefront.heroBody")}</p>
            <form onSubmit={submitSearch} className="sv-glass sv-motion-fade-up sv-motion-delay-3 mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-end" data-tour="storefront-search">
              <div className="cs-field min-w-0 flex-1">
                <label className="cs-field__label" htmlFor={searchFieldId}>{t("storefront.searchLabel")}</label>
                <div className="relative">
                  <MagnifyingGlass size={18} weight="regular" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input id={searchFieldId} className="cs-field__control w-full pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("storefront.searchPlaceholder")} autoComplete="off" enterKeyHint="search" />
                </div>
              </div>
              <button className="cs-button inline-flex min-h-11 shrink-0 items-center gap-2 sm:mb-0.5" type="submit">
                {t("storefront.searchSubmit")}
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </button>
            </form>
            <div className="sv-motion-fade-up sv-motion-delay-4 mt-8 flex flex-wrap items-center gap-3 text-sm">
              <span className="sv-glass inline-flex min-h-11 items-center rounded-full px-4 py-2 text-muted" aria-live="polite">{shelfBadgeLabel(loading, shelfProducts.length, t)}</span>
              <a className="sv-chip-link min-h-11" href="#catalog">{t("storefront.browseCatalog")}</a>
              <Link className="sv-chip-link min-h-11 inline-flex items-center gap-2" href="/membership">
                <Crown size={16} weight="duotone" aria-hidden="true" />
                {t("storefront.heroMembership")}
              </Link>
            </div>
          </div>
          <div className="relative hidden min-h-[22rem] lg:block" aria-hidden="true">
            <div className="sv-float absolute inset-y-8 left-6 w-[40%] rounded-[1.5rem] bg-gradient-to-br from-[var(--sv-lux-stone-900)] to-[var(--sv-lux-gold-strong)] opacity-90 shadow-2xl" style={{ "--sv-tilt": "-5deg" } as CSSProperties} />
            <div className="sv-float-slow absolute inset-y-4 left-[26%] w-[44%] rounded-[1.5rem] bg-gradient-to-br from-[#292524] to-[var(--sv-lux-gold)] shadow-2xl" style={{ "--sv-tilt": "4deg" } as CSSProperties} />
            <div className="sv-glass-heavy sv-motion-fade-up sv-motion-delay-2 absolute inset-y-0 right-0 flex w-[58%] flex-col justify-end rounded-[2rem] p-8">
              <BookOpen size={28} weight="duotone" className="text-[var(--sv-lux-gold)]" aria-hidden="true" />
              <p className="sv-lux-eyebrow mt-4">{t("storefront.tipEyebrow")}</p>
              <p className="sv-font-display mt-3 text-2xl leading-snug">{t("storefront.tipBody")}</p>
              <Link className="cs-button cs-button--secondary mt-6 inline-flex min-h-11 w-fit items-center gap-2" href="/features">
                {t("storefront.seePlatformStatus")}
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!loading && featuredProducts.length > 0 && !submittedQuery ? (
        <section className="border-b border-border/60 bg-[color-mix(in_oklab,var(--sv-lux-cream)_55%,var(--background))] py-16 sm:py-20" aria-labelledby="featured-heading">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <MotionReveal className="max-w-2xl">
              <p className="sv-lux-eyebrow">{t("storefront.featuredEyebrow")}</p>
              <h2 id="featured-heading" className="sv-font-display mt-3 text-3xl tracking-tight sm:text-4xl">{t("storefront.featuredTitle")}</h2>
            </MotionReveal>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {featuredProducts.map((product, index) => (
                <MotionReveal key={product.id} as="article" delayMs={index * 80} className="sv-glass-card sv-product-spotlight sv-card-lift group flex min-h-[28rem] flex-col overflow-hidden rounded-[1.75rem]">
                  <div className="sv-cover-sheen relative mx-4 mt-4 h-52 overflow-hidden rounded-2xl">
                    <ProductCover slug={product.slug} title={product.title} media={product.media} className="h-full w-full rounded-2xl" priority={index === 0} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-black/25" />
                    <div className="relative flex h-full items-end p-6 text-white">
                      <div>
                        <p className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-white/75">{product.category.name}</p>
                        <p className="sv-font-display mt-2 max-w-[12ch] truncate text-3xl leading-tight">{product.title}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6 pt-5">
                    <h3 className="sv-font-display text-2xl leading-snug">
                      <Link className="inline-flex min-h-11 items-center rounded-sm hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sv-lux-gold-soft,#ca8a04)]" href={`/products/${product.slug}`}>{product.title}</Link>
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted">{product.description}</p>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
                      <div>
                        {product.primaryOffer ? (
                          <>
                            <strong className="text-xl">{formatUsd(product.primaryOffer.priceUsd, locale)}</strong>
                            {product.primaryOffer.listPriceUsd ? <small className="ml-2 text-muted line-through">{formatUsd(product.primaryOffer.listPriceUsd, locale)}</small> : null}
                          </>
                        ) : <span className="cs-badge">{t("storefront.outOfStock")}</span>}
                      </div>
                      <Link className="cs-button cs-button--secondary inline-flex min-h-11 items-center gap-2" href={`/products/${product.slug}`}>
                        {t("common.open")}
                        <ArrowRight size={16} weight="bold" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-border/60 py-16 sm:py-24" aria-labelledby="editorial-heading">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <MotionReveal>
            <p className="sv-lux-eyebrow">{t("storefront.editorialEyebrow")}</p>
            <h2 id="editorial-heading" className="sv-font-display mt-4 text-3xl tracking-tight sm:text-4xl">{t("storefront.editorialTitle")}</h2>
            <p className="mt-6 text-base leading-8 text-muted sm:text-lg">{t("storefront.editorialBody")}</p>
          </MotionReveal>
          <MotionReveal delayMs={120}>
            <blockquote className="sv-glass-heavy relative rounded-[2rem] p-8 sm:p-10">
              <div className="sv-lux-divider mb-8" />
              <p className="sv-font-display text-2xl leading-snug text-balance sm:text-3xl">&ldquo;{t("storefront.editorialQuote")}&rdquo;</p>
              <footer className="mt-6 text-sm tracking-[0.12em] text-muted uppercase">{t("common.brand")}</footer>
            </blockquote>
          </MotionReveal>
        </div>
      </section>

      <section className="border-b border-border/60 bg-[color-mix(in_oklab,var(--panel)_40%,var(--background))] py-16 sm:py-20" aria-labelledby="values-heading">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <MotionReveal className="max-w-2xl">
            <p className="sv-lux-eyebrow">{t("storefront.valuesEyebrow")}</p>
            <h2 id="values-heading" className="sv-font-display mt-3 text-3xl tracking-tight sm:text-4xl">{t("storefront.valuesTitle")}</h2>
          </MotionReveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {brandValues.map(({ icon: Icon, titleKey, bodyKey }, index) => (
              <MotionReveal key={titleKey} delayMs={index * 70} className="sv-glass-card rounded-2xl p-6">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--sv-lux-gold)_14%,transparent)] text-[var(--sv-lux-gold-strong)]" aria-hidden="true">
                  <Icon size={22} weight="duotone" />
                </span>
                <h3 className="sv-font-display mt-5 text-xl">{t(titleKey)}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{t(bodyKey)}</p>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 sm:py-20" aria-labelledby="membership-heading">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--sv-lux-gold)_16%,transparent),transparent_62%)]" />
        <MotionReveal className="sv-glass-heavy relative mx-auto max-w-5xl rounded-[2rem] px-6 py-12 text-center sm:px-12 sm:py-16">
          <Crown size={32} weight="duotone" className="mx-auto text-[var(--sv-lux-gold)]" aria-hidden="true" />
          <p className="sv-lux-eyebrow mt-5">{t("storefront.membershipEyebrow")}</p>
          <h2 id="membership-heading" className="sv-font-display mt-4 text-3xl tracking-tight sm:text-4xl">{t("storefront.membershipTitle")}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted">{t("storefront.membershipBody")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link className="cs-button inline-flex min-h-11 items-center gap-2 px-6" href="/membership" aria-label={t("storefront.membershipCta")}>
              {t("storefront.membershipCta")}
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
            <Link className="cs-button cs-button--secondary min-h-11 px-6" href="/login?redirect=/membership" aria-label={t("storefront.membershipSecondary")}>{t("storefront.membershipSecondary")}</Link>
          </div>
        </MotionReveal>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="sv-lux-eyebrow">{t("storefront.catalogEyebrow")}</p>
            <h2 className="sv-font-display mt-3 text-3xl tracking-tight sm:text-4xl">{t("storefront.catalogTitle")}</h2>
          </div>
          <select aria-label={t("storefront.filterCategory")} className="cs-field__control min-h-11 min-w-48" value={category} onChange={(event) => { setLoading(true); setError(""); setCategory(event.target.value); }}>
            <option value="">{t("storefront.allCategories")}</option>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </div>

        {loading ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="cs-skeleton h-96 rounded-3xl" aria-hidden="true" />)}</div> : null}
        {error ? <div className="cs-alert cs-alert--danger mt-8" role="alert" tabIndex={-1}>{error}<button type="button" className="sv-text-link ml-3" onClick={() => { setLoading(true); setError(""); setSubmittedQuery((value) => `${value} `); }}>{t("common.retry")}</button></div> : null}
        {!loading && !error && shelfProducts.length === 0 ? (
          <div className="sv-glass-card mt-8 overflow-hidden rounded-3xl">
            <div className="border-b border-border bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--sv-lux-gold)_16%,transparent),transparent_60%)] px-6 py-10 sm:px-10">
              <h3 className="sv-font-display text-2xl">{t("storefront.emptyTitle")}</h3>
              <p className="mt-3 max-w-xl text-muted">{t("storefront.emptyBody")}</p>
              <button type="button" className="cs-button cs-button--secondary mt-6 min-h-11" onClick={() => { setQuery(""); setSubmittedQuery(""); setCategory(""); }}>{t("storefront.viewAll")}</button>
            </div>
          </div>
        ) : null}
        {!loading && shelfProducts.length ? (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shelfProducts.map((product, index) => (
                <MotionReveal key={product.id} as="article" delayMs={Math.min(index, 8) * 55} className="sv-glass-card sv-card-lift group flex min-h-[26rem] flex-col overflow-hidden rounded-3xl">
                  <div className="sv-cover-sheen relative mx-4 mt-4 h-40 overflow-hidden rounded-2xl">
                    <ProductCover slug={product.slug} title={product.title} media={product.media} className="h-full w-full rounded-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute inset-y-0 left-0 w-2 bg-black/20" />
                    <div className="relative flex h-full items-end p-5 text-white">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/70">{product.category.name}</p>
                        <p className="sv-font-display mt-2 max-w-[14ch] truncate text-2xl leading-tight">{product.title}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6 pt-5">
                    <h3 className="sv-font-display text-xl leading-snug">
                      <Link className="inline-flex min-h-11 items-center rounded-sm hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sv-lux-gold-soft,#ca8a04)]" href={`/products/${product.slug}`}>{product.title}</Link>
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
                      <button type="button" className={`cs-button min-h-11 shrink-0 ${addedId === product.id ? "sv-added-pop" : ""}`} disabled={!product.primaryOffer} onClick={() => addToCart(product)}>
                        {addedId === product.id ? t("storefront.added") : t("storefront.addToCart")}
                      </button>
                    </div>
                  </div>
                </MotionReveal>
              ))}
            </div>
            {hasMore ? (
              <div className="mt-10 flex justify-center">
                <button className="cs-button cs-button--secondary min-h-11 px-8" disabled={loadingMore} type="button" onClick={() => { void loadMore(); }}>
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
