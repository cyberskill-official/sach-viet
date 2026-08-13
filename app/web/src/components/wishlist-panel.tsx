"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = { id: string; slug: string; title: string };

export function WishlistPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wishlist")
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (response.status === 401) {
          window.location.assign("/login?redirect=/wishlist");
          return;
        }
        if (!response.ok) throw new Error(body.error || "Không thể tải danh sách yêu thích.");
        setItems(Array.isArray(body.items) ? body.items : []);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Không thể tải danh sách yêu thích.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function remove(productId: string) {
    const response = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== productId));
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <p className="cs-eyebrow text-accent-strong">Khách hàng</p>
      <h1 className="mt-2 text-3xl font-bold">Sách yêu thích</h1>
      {loading ? <div className="cs-skeleton mt-8 h-40 rounded-2xl" /> : null}
      {error ? <p className="cs-alert cs-alert--danger mt-8" role="alert">{error}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="mt-8 text-muted">Chưa có sách trong danh sách yêu thích.</p>
      ) : null}
      <ul className="mt-8 grid gap-3">
        {items.map((item) => (
          <li key={item.id} className="cs-surface-standard flex items-center justify-between gap-4 rounded-xl p-4">
            <Link className="font-semibold hover:underline" href={`/products/${item.slug}`}>{item.title}</Link>
            <button className="cs-button cs-button--secondary" type="button" onClick={() => remove(item.id)}>
              Gỡ
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
