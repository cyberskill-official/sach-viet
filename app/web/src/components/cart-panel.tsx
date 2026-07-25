"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CART_KEY, formatUsd, normalizeCart, updateCartQuantity } from "@/lib/portal-ui-core.mjs";

type CartItem = { vendorOfferId: string; title: string; priceUsd: string | null; quantity: number; plasticCover: boolean; giftWrap: boolean };

function loadCart(): CartItem[] {
  try {
    return normalizeCart(JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]"));
  } catch { return []; }
}

export function CartPanel() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setItems(loadCart()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const totalItems = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
  const estimatedTotal = useMemo(() => items.reduce((total, item) => total + (Number(item.priceUsd) || 0) * item.quantity, 0), [items]);
  function update(next: CartItem[]) { setItems(next); window.localStorage.setItem(CART_KEY, JSON.stringify(next)); }
  async function checkout() {
    setMessage("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
      const result = await response.json().catch(() => null);
      if (response.status === 401) { window.location.assign("/login?redirect=/ecom/cart"); return; }
      if (!response.ok || !result?.checkout?.url) { setMessage(result?.error ?? "Thanh toán hiện chưa khả dụng."); return; }
      window.location.assign(result.checkout.url);
    } finally { setSubmitting(false); }
  }
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <Link className="text-sm text-accent-strong hover:underline" href="/">← Tiếp tục chọn sách</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="cs-eyebrow text-accent-strong">Đơn hàng của bạn</p><h1 className="mt-2 text-4xl font-extrabold">Giỏ hàng</h1><p className="mt-2 text-muted">{totalItems} sản phẩm được lưu trên trình duyệt này.</p></div><Link className="cs-button cs-button--secondary" href="/ecom/orders">Xem đơn hàng</Link></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {items.length === 0 ? <div className="cs-empty-state cs-surface-standard rounded-2xl p-10"><h2>Giỏ hàng đang trống</h2><p>Chọn một cuốn sách phù hợp để bắt đầu.</p><Link className="cs-button" href="/">Khám phá sách</Link></div> : items.map((item) => (
            <article key={item.vendorOfferId} className="cs-surface-standard flex flex-wrap items-center justify-between gap-5 rounded-2xl p-5">
              <div className="min-w-0"><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-muted">{item.priceUsd ? formatUsd(item.priceUsd) : "Giá được xác nhận khi thanh toán"}{item.plasticCover ? " · Bọc sách" : ""}{item.giftWrap ? " · Gói quà" : ""}</p></div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted">Số lượng <input className="cs-field__control ml-2 w-20" min="1" max="99" type="number" value={item.quantity} onChange={(event) => update(updateCartQuantity(items, item.vendorOfferId, Number(event.target.value)))} /></label>
                <button className="cs-button cs-button--ghost" onClick={() => update(items.filter((entry) => entry.vendorOfferId !== item.vendorOfferId))}>Xoá</button>
              </div>
            </article>
          ))}
        </div>
        <aside className="cs-surface-heavy h-fit rounded-2xl p-6">
          <p className="cs-eyebrow">Tạm tính</p><p className="mt-2 text-3xl font-extrabold">{formatUsd(estimatedTotal)}</p><p className="mt-2 text-sm leading-6 text-muted">Giá và tình trạng hàng được xác nhận lại an toàn trước khi tạo đơn.</p>
          <button className="cs-button mt-6 w-full" disabled={items.length === 0 || submitting} onClick={checkout}>{submitting ? "Đang chuẩn bị…" : "Thanh toán an toàn"}</button>
          {message ? <p role="alert" className="cs-alert cs-alert--danger mt-4">{message}</p> : null}
        </aside>
      </div>
    </main>
  );
}
