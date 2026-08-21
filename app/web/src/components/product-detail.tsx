"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { addCartItem, CART_KEY, formatUsd, normalizeCart } from "@/lib/portal-ui-core.mjs";
import { useLocale } from "@/components/locale-provider";

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: { name: string };
  variants: Array<{ id: string; title: string; sku: string; attributes: Record<string, unknown> }>;
  primaryOffer: null | { id: string; priceUsd: string; listPriceUsd?: string | null; stockQuantity: number };
};

export function ProductDetail({ slug }: { slug: string }) {
  const { locale, t } = useLocale();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [wishState, setWishState] = useState("");
  const [reviewState, setReviewState] = useState("");
  const [reviewPending, setReviewPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/catalog/products/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.product) throw new Error(body.error || t("validation.notFound"));
        setProduct(body.product);
      })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); });
    return () => controller.abort();
  }, [slug, t]);

  function add() {
    if (!product?.primaryOffer) return;
    let current: Array<Record<string, unknown>> = [];
    try { current = normalizeCart(JSON.parse(window.localStorage.getItem(CART_KEY) || "[]")); } catch { /* ignore */ }
    const next = addCartItem(current, { vendorOfferId: product.primaryOffer.id, title: product.title, priceUsd: product.primaryOffer.priceUsd, quantity: 1 });
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
    setAdded(true);
  }

  async function saveWishlist() {
    if (!product) return;
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    if (response.status === 401) {
      window.location.assign(`/login?redirect=/products/${encodeURIComponent(slug)}`);
      return;
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setWishState(body.error || t("validation.serverError"));
      return;
    }
    setWishState(t("product.wishlist"));
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    setReviewPending(true);
    setReviewState("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/support/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        rating: Number(data.get("rating")),
        body: String(data.get("body") || ""),
      }),
    });
    setReviewPending(false);
    if (response.status === 401) {
      window.location.assign(`/login?redirect=/products/${encodeURIComponent(slug)}`);
      return;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setReviewState(payload.error || t("validation.serverError"));
      return;
    }
    form.reset();
    setReviewState(t("product.submitReview"));
  }

  if (error) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
        <div className="cs-alert cs-alert--danger" role="alert">{error}</div>
        <Link className="cs-button cs-button--secondary mt-5" href="/">{t("nav.home")}</Link>
      </main>
    );
  }
  if (!product) return <main className="mx-auto min-h-screen max-w-5xl px-6 py-16"><div className="cs-skeleton h-96 rounded-3xl" /></main>;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link className="text-sm text-accent-strong hover:underline" href="/">← {t("nav.home")}</Link>
        <section className="mt-7 grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div className="cs-surface-heavy grid min-h-[28rem] place-items-center rounded-[2rem] bg-accent-tint text-7xl font-extrabold text-accent-strong">{product.title.slice(0, 2).toUpperCase()}</div>
          <div className="py-4">
            <p className="cs-eyebrow text-accent-strong">{product.category.name}</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">{product.title}</h1>
            <p className="mt-6 whitespace-pre-line text-lg leading-8 text-muted">{product.description}</p>
            {product.variants.length ? (
              <div className="mt-7">
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <span className="cs-badge" key={variant.id}>{variant.title} · {variant.sku}</span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="cs-surface-standard mt-8 rounded-2xl p-6">
              {product.primaryOffer ? (
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <p className="text-3xl font-extrabold">{formatUsd(product.primaryOffer.priceUsd, locale)}</p>
                    <p className="mt-1 text-sm text-muted">{t("storefront.inStock", { count: product.primaryOffer.stockQuantity })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="cs-button" data-tour="product-add-cart" onClick={add}>{t("product.addToCart")}</button>
                    <button className="cs-button cs-button--secondary" type="button" onClick={saveWishlist}>{t("product.wishlist")}</button>
                    <Link className="cs-button cs-button--secondary" href="/ecom/cart">{t("nav.cart")}</Link>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="cs-badge">{t("storefront.outOfStock")}</span>
                </div>
              )}
              {added ? <p className="mt-4 text-sm font-semibold text-accent-strong" role="status">{t("product.addToCart")}</p> : null}
              {wishState ? <p className="mt-2 text-sm font-semibold text-accent-strong" role="status">{wishState}</p> : null}
            </div>
            <form className="cs-surface-standard mt-6 grid gap-3 rounded-2xl p-6" onSubmit={submitReview}>
              <h2 className="text-lg font-bold">{t("product.reviews")}</h2>
              <label className="grid gap-2 text-sm">
                {t("product.rating")}
                <select required name="rating" className="cs-field__control" defaultValue="5">
                  <option value="5">5</option>
                  <option value="4">4</option>
                  <option value="3">3</option>
                  <option value="2">2</option>
                  <option value="1">1</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                {t("product.comment")}
                <textarea required name="body" className="cs-field__control min-h-24" maxLength={2000} />
              </label>
              <button className="cs-button cs-button--secondary" disabled={reviewPending} type="submit">
                {reviewPending ? t("common.loading") : t("product.submitReview")}
              </button>
              {reviewState ? <p className="text-sm font-semibold text-accent-strong" role="status">{reviewState}</p> : null}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
