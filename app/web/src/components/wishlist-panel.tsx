"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { LuxuryShell } from "@/components/luxury-shell";

type Item = { id: string; slug: string; title: string };

export function WishlistPanel() {
  const { t } = useLocale();
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
        if (!response.ok) throw new Error(body.error || t("validation.serverError"));
        setItems(Array.isArray(body.items) ? body.items : []);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : t("validation.serverError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function remove(productId: string) {
    const response = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== productId));
  }

  return (
    <LuxuryShell width="md" tourId="tour.wishlist">
      <p className="sv-lux-eyebrow">{t("nav.account")}</p>
      <h1 className="sv-font-display mt-2 text-4xl tracking-tight" data-tour="wishlist-heading">{t("wishlist.title")}</h1>
      {loading ? <div className="cs-skeleton mt-8 h-40 rounded-2xl" /> : null}
      {error ? <p className="cs-alert cs-alert--danger mt-8" role="alert">{error}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="mt-8 text-muted" data-tour="wishlist-list">{t("wishlist.empty")}</p>
      ) : null}
      <ul className="mt-8 grid gap-3" data-tour="wishlist-list">
        {items.map((item) => (
          <li key={item.id} className="sv-glass-card flex items-center justify-between gap-4 rounded-xl p-4">
            <Link className="sv-font-display text-lg hover:text-accent-strong" href={`/products/${item.slug}`}>{item.title}</Link>
            <button className="cs-button cs-button--secondary min-h-11" type="button" onClick={() => remove(item.id)}>
              {t("wishlist.remove")}
            </button>
          </li>
        ))}
      </ul>
    </LuxuryShell>
  );
}
