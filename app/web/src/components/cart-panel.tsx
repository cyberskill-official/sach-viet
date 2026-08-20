"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CART_KEY, formatUsd, normalizeCart, updateCartQuantity } from "@/lib/portal-ui-core.mjs";

type CartItem = {
  vendorOfferId: string;
  title: string;
  priceUsd: string | null;
  quantity: number;
  plasticCover: boolean;
  giftWrap: boolean;
};
type CheckoutProvider = "stripe" | "paypal";
type Quote = {
  currency: string;
  subtotalUsd: string;
  taxUsd: string;
  shippingUsd: string;
  totalUsd: string;
  reservationTtlMs: number;
  policy?: { returnsPolicy?: string; paymentsMode?: string };
  lines?: Array<{ vendorOfferId: string; title: string; unitPriceUsd: string; quantity: number }>;
};

function loadCart(): CartItem[] {
  try {
    return normalizeCart(JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

function reservationMinutes(ttlMs: number) {
  return Math.max(1, Math.round(ttlMs / 60_000));
}

export function CartPanel() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState<CheckoutProvider | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setItems(loadCart()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const refreshQuote = useCallback(async (cart: CartItem[]) => {
    if (cart.length === 0) {
      setQuote(null);
      setQuoteError("");
      return;
    }
    setQuoting(true);
    setQuoteError("");
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.quote) {
        setQuote(null);
        setQuoteError(result?.error ?? "Không thể báo giá từ máy chủ.");
        return;
      }
      setQuote(result.quote);
    } catch {
      setQuote(null);
      setQuoteError("Không thể báo giá từ máy chủ.");
    } finally {
      setQuoting(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshQuote(items);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [items, refreshQuote]);

  const totalItems = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
  const estimatedTotal = useMemo(
    () => items.reduce((total, item) => total + (Number(item.priceUsd) || 0) * item.quantity, 0),
    [items],
  );

  function update(next: CartItem[]) {
    setItems(next);
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  async function checkout(provider: CheckoutProvider) {
    setMessage("");
    setSubmitting(provider);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, provider }),
      });
      const result = await response.json().catch(() => null);
      if (response.status === 401) {
        window.location.assign("/login?redirect=/ecom/cart");
        return;
      }
      if (!response.ok || !result?.checkout?.url) {
        setMessage(result?.error ?? "Thanh toán hiện chưa khả dụng.");
        return;
      }
      window.localStorage.setItem(CART_KEY, "[]");
      window.location.assign(result.checkout.url);
    } finally {
      setSubmitting(null);
    }
  }

  const busy = submitting !== null;
  const displayTotal = quote?.totalUsd ?? String(estimatedTotal);
  const ttlMinutes = quote ? reservationMinutes(quote.reservationTtlMs) : 30;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <Link className="text-sm text-accent-strong hover:underline" href="/">
        ← Tiếp tục chọn sách
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="cs-eyebrow text-accent-strong">Đơn hàng của bạn</p>
          <h1 className="mt-2 text-4xl font-extrabold">Giỏ hàng</h1>
          <p className="mt-2 text-muted">{totalItems} sản phẩm được lưu trên trình duyệt này.</p>
        </div>
        <Link className="cs-button cs-button--secondary" href="/ecom/orders">
          Xem đơn hàng
        </Link>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="cs-empty-state cs-surface-standard rounded-2xl p-10">
              <h2>Giỏ hàng đang trống</h2>
              <p>Chọn một cuốn sách phù hợp để bắt đầu.</p>
              <Link className="cs-button" href="/">
                Khám phá sách
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.vendorOfferId}
                className="cs-surface-standard flex flex-wrap items-center justify-between gap-5 rounded-2xl p-5"
              >
                <div className="min-w-0">
                  <p className="font-bold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.priceUsd ? formatUsd(item.priceUsd) : "Giá được xác nhận khi thanh toán"}
                    {item.plasticCover ? " · Bọc sách" : ""}
                    {item.giftWrap ? " · Gói quà" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-muted">
                    Số lượng{" "}
                    <input
                      className="cs-field__control ml-2 w-20"
                      min="1"
                      max="99"
                      type="number"
                      value={item.quantity}
                      onChange={(event) =>
                        update(updateCartQuantity(items, item.vendorOfferId, Number(event.target.value)))
                      }
                    />
                  </label>
                  <button
                    className="cs-button cs-button--ghost"
                    onClick={() => update(items.filter((entry) => entry.vendorOfferId !== item.vendorOfferId))}
                  >
                    Xoá
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
        <aside className="cs-surface-heavy h-fit rounded-2xl p-6">
          <p className="cs-eyebrow">Báo giá máy chủ</p>
          <p className="mt-2 text-3xl font-extrabold">{formatUsd(displayTotal)}</p>
          <dl className="mt-4 space-y-1 text-sm text-muted">
            <div className="flex justify-between gap-3">
              <dt>Tạm tính</dt>
              <dd>{formatUsd(quote?.subtotalUsd ?? estimatedTotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Thuế</dt>
              <dd>{formatUsd(quote?.taxUsd ?? "0")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Vận chuyển</dt>
              <dd>{formatUsd(quote?.shippingUsd ?? "0")}</dd>
            </div>
            <div className="flex justify-between gap-3 font-semibold text-foreground">
              <dt>Tổng (USD)</dt>
              <dd>{formatUsd(displayTotal)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm leading-6 text-muted">
            {quoting
              ? "Đang xác nhận giá và tồn kho…"
              : `Interim: thuế = 0, không ship. Giữ hàng ${ttlMinutes} phút sau khi tạo đơn chờ thanh toán (sandbox).`}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Đổi trả / hoàn tiền: chưa mở (DEC-RET deferred). Liên hệ hỗ trợ nếu cần trợ giúp.
          </p>
          {quoteError ? (
            <p role="alert" className="cs-alert cs-alert--danger mt-3">
              {quoteError}
            </p>
          ) : null}
          <button
            className="cs-button mt-6 w-full"
            disabled={items.length === 0 || busy || Boolean(quoteError)}
            onClick={() => checkout("stripe")}
          >
            {submitting === "stripe" ? "Đang chuẩn bị…" : "Thanh toán Stripe (sandbox)"}
          </button>
          <button
            className="cs-button cs-button--secondary mt-3 w-full"
            disabled={items.length === 0 || busy || Boolean(quoteError)}
            onClick={() => checkout("paypal")}
          >
            {submitting === "paypal" ? "Đang chuẩn bị…" : "Thanh toán PayPal (sandbox)"}
          </button>
          {message ? (
            <p role="alert" className="cs-alert cs-alert--danger mt-4">
              {message}
            </p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
