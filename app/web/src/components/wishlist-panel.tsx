"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { TourLauncher } from "@/components/tours/tour-provider";

type Item = { id: string; slug: string; title: string };

export function WishlistPanel() {
  const { locale, setLocale, t } = useLocale();
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
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-panel/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="font-bold">{t("common.brand")}</Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link className="cs-button cs-button--ghost" href="/features">{t("nav.features")}</Link>
            <TourLauncher tourId="tour.wishlist" />
            <button type="button" className="cs-button cs-button--ghost" aria-label={t("common.language")} onClick={() => setLocale(locale === "en" ? "vi" : "en")}>
              {locale === "en" ? "VI" : "EN"}
            </button>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="cs-eyebrow text-accent-strong">{t("nav.account")}</p>
        <h1 className="mt-2 text-3xl font-bold" data-tour="wishlist-heading">{t("wishlist.title")}</h1>
        {loading ? <div className="cs-skeleton mt-8 h-40 rounded-2xl" /> : null}
        {error ? <p className="cs-alert cs-alert--danger mt-8" role="alert">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="mt-8 text-muted" data-tour="wishlist-list">{t("wishlist.empty")}</p>
        ) : null}
        <ul className="mt-8 grid gap-3" data-tour="wishlist-list">
          {items.map((item) => (
            <li key={item.id} className="cs-surface-standard flex items-center justify-between gap-4 rounded-xl p-4">
              <Link className="font-semibold hover:underline" href={`/products/${item.slug}`}>{item.title}</Link>
              <button className="cs-button cs-button--secondary" type="button" onClick={() => remove(item.id)}>
                {t("wishlist.remove")}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
