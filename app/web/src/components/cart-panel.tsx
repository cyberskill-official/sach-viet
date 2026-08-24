"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CART_KEY, formatUsd, normalizeCart, updateCartQuantity } from "@/lib/portal-ui-core.mjs";
import { useLocale } from "@/components/locale-provider";
import { LuxuryShell } from "@/components/luxury-shell";

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
  taxEngine?: string;
  taxSource?: string;
  carrierId?: string;
  shipTo?: ShipTo | null;
  policy?: { returnsPolicy?: string; paymentsMode?: string; taxEngine?: string; version?: string };
  lines?: Array<{ vendorOfferId: string; title: string; unitPriceUsd: string; quantity: number }>;
};
type ShipTo = {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postal: string;
  country: "US" | "VN";
  phone?: string | null;
};
type CarrierId = "none" | "manual_pickup";

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
  const { locale, t } = useLocale();
  const [items, setItems] = useState<CartItem[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState<CheckoutProvider | null>(null);
  const [carrierId, setCarrierId] = useState<CarrierId>("none");
  const [shipTo, setShipTo] = useState<ShipTo>({
    name: "",
    line1: "",
    city: "",
    postal: "",
    country: "VN",
    line2: "",
    region: "",
    phone: "",
  });

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
        body: JSON.stringify({
          items: cart,
          carrierId,
          shipTo: shipTo.name && shipTo.line1 && shipTo.city && shipTo.postal
            ? shipTo
            : undefined,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.quote) {
        setQuote(null);
        setQuoteError(result?.error ?? t("cart.quoteError"));
        return;
      }
      setQuote(result.quote);
    } catch {
      setQuote(null);
      setQuoteError(t("cart.quoteError"));
    } finally {
      setQuoting(false);
    }
  }, [carrierId, shipTo, t]);

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
        body: JSON.stringify({ items, provider, shipTo, carrierId }),
      });
      const result = await response.json().catch(() => null);
      if (response.status === 401) {
        window.location.assign("/login?redirect=/ecom/cart");
        return;
      }
      if (!response.ok || !result?.checkout?.url) {
        setMessage(result?.error ?? t("cart.checkoutError"));
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
  const shipToReady = Boolean(shipTo.name.trim() && shipTo.line1.trim() && shipTo.city.trim() && shipTo.postal.trim() && (shipTo.country === "US" || shipTo.country === "VN"));

  return (
    <LuxuryShell width="xl" tourId="tour.product_cart">
      <Link className="inline-flex min-h-11 items-center text-sm text-accent-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sv-lux-gold-soft,#ca8a04)]" href="/">
        ← {t("cart.continueShopping")}
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sv-lux-eyebrow">{t("orders.title")}</p>
          <h1 className="sv-font-display mt-2 text-4xl tracking-tight">{t("cart.title")}</h1>
          <p className="mt-2 text-muted">{totalItems}</p>
        </div>
        <Link className="cs-button cs-button--secondary min-h-11" href="/ecom/orders">
          {t("nav.orders")}
        </Link>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]" data-tour="cart-panel">
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="sv-glass-card cs-empty-state rounded-2xl p-10">
              <h2 className="sv-font-display text-2xl">{t("cart.empty")}</h2>
              <Link className="cs-button mt-6 min-h-11" href="/">
                {t("cart.continueShopping")}
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.vendorOfferId}
                className="sv-glass-card flex flex-wrap items-center justify-between gap-5 rounded-2xl p-5"
              >
                <div className="min-w-0">
                  <p className="font-bold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.priceUsd ? formatUsd(item.priceUsd, locale) : "—"}
                    {item.plasticCover ? ` · ${t("cart.plasticCover")}` : ""}
                    {item.giftWrap ? ` · ${t("cart.giftWrap")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-muted">
                    {t("cart.quantity")}{" "}
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
                    {t("cart.remove")}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
        <aside className="sv-glass-heavy h-fit rounded-2xl p-6">
          <p className="sv-lux-eyebrow">{t("cart.shipTo")}</p>
          <div className="mt-3 space-y-2 text-sm">
            <input className="cs-field__control w-full" placeholder={t("cart.name")} value={shipTo.name} onChange={(e) => setShipTo((s) => ({ ...s, name: e.target.value }))} />
            <input className="cs-field__control w-full" placeholder={t("cart.line1")} value={shipTo.line1} onChange={(e) => setShipTo((s) => ({ ...s, line1: e.target.value }))} />
            <input className="cs-field__control w-full" placeholder={t("cart.line2")} value={shipTo.line2 ?? ""} onChange={(e) => setShipTo((s) => ({ ...s, line2: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input className="cs-field__control w-full" placeholder={t("cart.city")} value={shipTo.city} onChange={(e) => setShipTo((s) => ({ ...s, city: e.target.value }))} />
              <input className="cs-field__control w-full" placeholder={t("cart.postal")} value={shipTo.postal} onChange={(e) => setShipTo((s) => ({ ...s, postal: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="cs-field__control w-full" value={shipTo.country} onChange={(e) => setShipTo((s) => ({ ...s, country: e.target.value as "US" | "VN" }))} aria-label={t("cart.country")}>
                <option value="VN">VN</option>
                <option value="US">US</option>
              </select>
              <select className="cs-field__control w-full" value={carrierId} onChange={(e) => setCarrierId(e.target.value as CarrierId)} aria-label={t("cart.carrier")}>
                <option value="none">{t("cart.carrierNone")}</option>
                <option value="manual_pickup">{t("cart.carrierPickup")}</option>
              </select>
            </div>
          </div>
          <p className="sv-lux-eyebrow mt-6">{t("cart.total")}</p>
          <p className="sv-font-display mt-2 text-3xl">{formatUsd(displayTotal, locale)}</p>
          <dl className="mt-4 space-y-1 text-sm text-muted">
            <div className="flex justify-between gap-3">
              <dt>{t("cart.subtotal")}</dt>
              <dd>{formatUsd(quote?.subtotalUsd ?? estimatedTotal, locale)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{t("cart.tax")}</dt>
              <dd>{formatUsd(quote?.taxUsd ?? "0", locale)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{t("cart.shipping")}</dt>
              <dd>{formatUsd(quote?.shippingUsd ?? "0", locale)}</dd>
            </div>
            <div className="flex justify-between gap-3 font-semibold text-foreground">
              <dt>{t("cart.total")}</dt>
              <dd>{formatUsd(displayTotal, locale)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm leading-6 text-muted">
            {quoting
              ? t("common.loading")
              : t("cart.reservationNote", { minutes: ttlMinutes })}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{t("cart.policyTaxStub")}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{t("cart.policyPayments")}</p>
          {quoteError ? (
            <p role="alert" className="cs-alert cs-alert--danger mt-3">
              {quoteError}
            </p>
          ) : null}
          <div data-tour="cart-checkout">
            <button
              className="cs-button mt-6 w-full"
              disabled={items.length === 0 || busy || Boolean(quoteError) || !shipToReady}
              onClick={() => checkout("stripe")}
            >
              {submitting === "stripe" ? t("common.loading") : t("cart.payStripe")}
            </button>
            <button
              className="cs-button cs-button--secondary mt-3 w-full"
              disabled={items.length === 0 || busy || Boolean(quoteError) || !shipToReady}
              onClick={() => checkout("paypal")}
            >
              {submitting === "paypal" ? t("common.loading") : t("cart.payPaypal")}
            </button>
          </div>
          {message ? (
            <p role="alert" className="cs-alert cs-alert--danger mt-4">
              {message}
            </p>
          ) : null}
        </aside>
      </div>
    </LuxuryShell>
  );
}
