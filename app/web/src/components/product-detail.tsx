"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addCartItem, CART_KEY, formatUsd, normalizeCart } from "@/lib/portal-ui-core.mjs";

type Product = {
  slug: string;
  title: string;
  description: string;
  category: { name: string };
  variants: Array<{ id: string; title: string; sku: string; attributes: Record<string, unknown> }>;
  primaryOffer: null | { id: string; priceUsd: string; listPriceUsd?: string | null; stockQuantity: number };
};

export function ProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/catalog/products/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.product) throw new Error(body.error || "Không thể tải thông tin sách.");
        setProduct(body.product);
      })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); });
    return () => controller.abort();
  }, [slug]);

  function add() {
    if (!product?.primaryOffer) return;
    let current: Array<Record<string, unknown>> = [];
    try { current = normalizeCart(JSON.parse(window.localStorage.getItem(CART_KEY) || "[]")); } catch {}
    const next = addCartItem(current, { vendorOfferId: product.primaryOffer.id, title: product.title, priceUsd: product.primaryOffer.priceUsd, quantity: 1 });
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
    setAdded(true);
  }

  if (error) return <main className="mx-auto min-h-screen max-w-4xl px-6 py-16"><div className="cs-alert cs-alert--danger" role="alert">{error}</div><Link className="cs-button cs-button--secondary mt-5" href="/">Về trang sách</Link></main>;
  if (!product) return <main className="mx-auto min-h-screen max-w-5xl px-6 py-16"><div className="cs-skeleton h-96 rounded-3xl" /></main>;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link className="text-sm text-accent-strong hover:underline" href="/">← Trở lại danh mục</Link>
        <section className="mt-7 grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div className="cs-surface-heavy grid min-h-[28rem] place-items-center rounded-[2rem] bg-accent-tint text-7xl font-extrabold text-accent-strong">{product.title.slice(0, 2).toUpperCase()}</div>
          <div className="py-4">
            <p className="cs-eyebrow text-accent-strong">{product.category.name}</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">{product.title}</h1>
            <p className="mt-6 whitespace-pre-line text-lg leading-8 text-muted">{product.description}</p>
            {product.variants.length ? <div className="mt-7"><p className="text-sm font-semibold">Phiên bản</p><div className="mt-2 flex flex-wrap gap-2">{product.variants.map((variant) => <span className="cs-badge" key={variant.id}>{variant.title} · {variant.sku}</span>)}</div></div> : null}
            <div className="cs-surface-standard mt-8 rounded-2xl p-6">
              {product.primaryOffer ? (
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div><p className="text-3xl font-extrabold">{formatUsd(product.primaryOffer.priceUsd)}</p><p className="mt-1 text-sm text-muted">Còn {product.primaryOffer.stockQuantity} cuốn sẵn sàng giao</p></div>
                  <div className="flex items-center gap-3"><button className="cs-button" onClick={add}>Thêm vào giỏ</button><Link className="cs-button cs-button--secondary" href="/ecom/cart">Xem giỏ hàng</Link></div>
                </div>
              ) : <div><span className="cs-badge">Tạm hết hàng</span><p className="mt-2 text-muted">Cuốn sách này chưa có ưu đãi khả dụng.</p></div>}
              {added ? <p className="mt-4 text-sm font-semibold text-accent-strong" role="status">Đã thêm vào giỏ hàng.</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
