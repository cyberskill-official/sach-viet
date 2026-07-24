"use client";

import { useEffect, useMemo, useState } from "react";

type CartItem = { vendorOfferId: string; title: string; quantity: number; plasticCover: boolean; giftWrap: boolean };
const CART_KEY = "sv_cart_v1";

function loadCart(): CartItem[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item?.vendorOfferId === "string" && typeof item?.title === "string" && Number.isInteger(item?.quantity) && item.quantity > 0) : [];
  } catch { return []; }
}

export function CartPanel() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setItems(loadCart()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const totalItems = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
  function update(next: CartItem[]) { setItems(next); window.localStorage.setItem(CART_KEY, JSON.stringify(next)); }
  async function checkout() {
    setMessage("");
    const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.checkout?.url) { setMessage(result?.error ?? "Checkout is unavailable."); return; }
    window.location.assign(result.checkout.url);
  }
  return <main className="mx-auto min-h-screen max-w-3xl px-6 py-12"><h1 className="text-3xl font-semibold">Your cart</h1><p className="mt-2 text-muted">{totalItems} item{totalItems === 1 ? "" : "s"} saved in this browser.</p><div className="mt-6 space-y-3">{items.length === 0 ? <p className="rounded border border-border bg-panel p-4">Your cart is empty.</p> : items.map((item) => <article key={item.vendorOfferId} className="flex items-center justify-between rounded border border-border bg-panel p-4"><div><p className="font-medium">{item.title}</p><p className="text-sm text-muted">Quantity {item.quantity}{item.plasticCover ? ", plastic cover" : ""}{item.giftWrap ? ", gift wrap" : ""}</p></div><button className="text-sm text-muted" onClick={() => update(items.filter((entry) => entry.vendorOfferId !== item.vendorOfferId))}>Remove</button></article>)}</div><button className="mt-6 rounded bg-foreground px-4 py-2 text-background disabled:opacity-50" disabled={items.length === 0} onClick={checkout}>Checkout with Stripe</button>{message ? <p role="alert" className="mt-3 text-sm text-red-600">{message}</p> : null}</main>;
}
