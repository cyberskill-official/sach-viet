"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addCartItem, CART_KEY, formatUsd, normalizeCart } from "@/lib/portal-ui-core.mjs";
import { useLocale } from "@/components/locale-provider";
import { TourLauncher } from "@/components/tours/tour-provider";

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: { slug: string; name: string };
  primaryOffer: null | { id: string; priceUsd: string; listPriceUsd?: string | null; stockQuantity: number };
};

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

export function Storefront() {
  const { locale, setLocale, t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(() => typeof window === "undefined" ? 0 : readCart().reduce((sum, item) => sum + item.quantity, 0));
  const pageSize = 24;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (submittedQuery) params.set("q", submittedQuery);
    if (category) params.set("category", category);
    params.set("limit", String(pageSize));
    fetch(`/api/catalog/products?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        const items = catalogItems(body);
        if (!response.ok) throw new Error(apiMessage(body, t("storefront.catalogLoadError")));
        setProducts(items);
        setHasMore(Boolean(body.nextCursor) || (!submittedQuery && items.length === pageSize));
      })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, submittedQuery, t]);

  const categories = useMemo(() => [...new Map(products.map((product) => [product.category.slug, product.category])).values()], [products]);

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
      if (!response.ok) throw new Error(apiMessage(body, t("storefront.catalogLoadError")));
      setProducts((current) => [...current, ...items]);
      setHasMore(Boolean(body.nextCursor) || items.length === pageSize);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("storefront.catalogLoadError"));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-panel/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-3" data-tour="storefront-brand">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-strong font-bold text-white">SV</span>
            <span className="min-w-0"><strong className="block truncate text-lg">{t("common.brand")}</strong><small className="text-muted">{t("common.tagline")}</small></span>
          </Link>
          <nav className="flex max-w-full flex-wrap items-center gap-2 text-sm" data-tour="storefront-nav">
            <Link className="cs-button cs-button--ghost" href="/features">{t("nav.features")}</Link>
            <Link className="cs-button cs-button--ghost" href="/account">{t("nav.account")}</Link>
            <Link className="cs-button cs-button--ghost" href="/wishlist">{t("nav.wishlist")}</Link>
            <Link className="cs-button cs-button--ghost" href="/support">{t("nav.support")}</Link>
            <Link className="cs-button cs-button--ghost" href="/ecom/orders">{t("nav.orders")}</Link>
            <Link className="cs-button cs-button--secondary" href="/ecom/cart">{t("nav.cart")} ({cartCount})</Link>
            <TourLauncher tourId="tour.storefront" />
            <button type="button" className="cs-button cs-button--ghost" aria-label={t("common.language")} onClick={() => setLocale(locale === "en" ? "vi" : "en")}>
              {locale === "en" ? "VI" : "EN"}
            </button>
            <Link className="cs-button cs-button--ghost" href="/register">{t("nav.register")}</Link>
            <Link className="cs-button" href="/login">{t("nav.login")}</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="cs-aurora-wash absolute inset-0 opacity-25" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_.8fr] lg:py-24">
          <div>
            <p className="cs-eyebrow text-accent-strong">{t("storefront.eyebrow")}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t("storefront.heroTitle")}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{t("storefront.heroBody")}</p>
            <form onSubmit={submitSearch} className="cs-surface-standard mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl p-3 sm:flex-row" data-tour="storefront-search">
              <input aria-label={t("storefront.searchLabel")} className="cs-field__control min-w-0 flex-1" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("storefront.searchPlaceholder")} />
              <button className="cs-button shrink-0" type="submit">{t("storefront.searchSubmit")}</button>
            </form>
          </div>
          <div className="cs-surface-heavy hidden min-h-72 rounded-[2rem] p-8 lg:flex lg:flex-col lg:justify-end">
            <p className="cs-eyebrow">{t("storefront.tipEyebrow")}</p>
            <p className="mt-3 text-2xl font-bold">{t("storefront.tipBody")}</p>
            <Link className="cs-button cs-button--secondary mt-6 w-fit" href="/features">{t("nav.features")}</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="cs-eyebrow text-accent-strong">{t("storefront.catalogEyebrow")}</p><h2 className="mt-2 text-3xl font-bold">{t("storefront.catalogTitle")}</h2></div>
          <select aria-label={t("storefront.filterCategory")} className="cs-field__control" value={category} onChange={(event) => { setLoading(true); setError(""); setCategory(event.target.value); }}>
            <option value="">{t("storefront.allCategories")}</option>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </div>

        {loading ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="cs-skeleton h-72 rounded-2xl" />)}</div> : null}
        {error ? <div className="cs-alert cs-alert--danger mt-8" role="alert">{error}<button className="ml-3 underline" onClick={() => { setLoading(true); setError(""); setSubmittedQuery((value) => `${value} `); }}>{t("common.retry")}</button></div> : null}
        {!loading && !error && products.length === 0 ? <div className="cs-empty-state mt-8"><h3>{t("storefront.emptyTitle")}</h3><p>{t("storefront.emptyBody")}</p><button className="cs-button cs-button--secondary" onClick={() => { setQuery(""); setSubmittedQuery(""); setCategory(""); }}>{t("storefront.viewAll")}</button></div> : null}
        {!loading && products.length ? (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article key={product.id} className="cs-surface-standard group flex min-h-80 flex-col rounded-2xl p-6">
                  <div className="mb-6 grid h-28 place-items-center rounded-xl bg-accent-tint text-4xl font-extrabold text-accent-strong">{product.title.slice(0, 2).toUpperCase()}</div>
                  <p className="cs-eyebrow text-muted">{product.category.name}</p>
                  <h3 className="mt-2 text-xl font-bold"><Link href={`/products/${product.slug}`}>{product.title}</Link></h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{product.description}</p>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                    <div>{product.primaryOffer ? <><strong className="text-lg">{formatUsd(product.primaryOffer.priceUsd, locale)}</strong><small className="block text-muted">{t("storefront.inStock", { count: product.primaryOffer.stockQuantity })}</small></> : <span className="cs-badge">{t("storefront.outOfStock")}</span>}</div>
                    <button className="cs-button" disabled={!product.primaryOffer} onClick={() => addToCart(product)}>{t("storefront.addToCart")}</button>
                  </div>
                </article>
              ))}
            </div>
            {hasMore ? (
              <div className="mt-8 flex justify-center">
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
