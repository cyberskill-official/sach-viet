"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/portal-ui-core.mjs";
import { useLocale } from "@/components/locale-provider";

type TimelineEvent = { at: number; kind: string; label: string; status: string };
type Order = { id: string; status: string; currency: string; subtotalUsd: string; createdAt: number; timeline?: TimelineEvent[] };

function apiMessage(body: Record<string, unknown>, fallback: string) {
  const error = body.error;
  if (error && typeof error === "object" && error !== null && "message" in error) return String((error as { message: string }).message);
  if (typeof error === "string") return error;
  return fallback;
}

function orderItems(body: Record<string, unknown>): Order[] {
  if (Array.isArray(body.items)) return body.items as Order[];
  if (Array.isArray(body.orders)) return body.orders as Order[];
  return [];
}

export function OrderHistory({ highlightId }: { highlightId?: string } = {}) {
  const { locale, t } = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 50;

  function statusLabel(status: string) {
    switch (status) {
      case "pending_payment":
        return t("orders.pendingPayment");
      case "paid":
        return t("orders.paid");
      case "cancelled":
        return t("orders.cancelled");
      case "expired":
        return t("orders.expired");
      default:
        return status;
    }
  }

  useEffect(() => {
    fetch(`/api/orders?limit=${pageSize}`)
      .then(async (response) => {
        const body = await response.json();
        if (response.status === 401) { window.location.assign("/login?redirect=/ecom/orders"); return; }
        const items = orderItems(body);
        if (!response.ok) throw new Error(apiMessage(body, t("validation.serverError")));
        setOrders(items);
        setHasMore(Boolean(body.nextCursor) || items.length === pageSize);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [t]);

  async function loadMore() {
    if (loadingMore || !hasMore || orders.length === 0) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/orders?limit=${pageSize}&after=${encodeURIComponent(orders[orders.length - 1].id)}`);
      const body = await response.json();
      const items = orderItems(body);
      if (!response.ok) throw new Error(apiMessage(body, t("validation.serverError")));
      setOrders((current) => [...current, ...items]);
      setHasMore(Boolean(body.nextCursor) || items.length === pageSize);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("validation.serverError"));
    } finally {
      setLoadingMore(false);
    }
  }

  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <Link className="text-sm text-accent-strong hover:underline" href="/">← {t("nav.home")}</Link>
      <p className="cs-eyebrow mt-8 text-accent-strong">{t("nav.account")}</p>
      <h1 className="mt-2 text-4xl font-extrabold">{t("orders.title")}</h1>
      {loading ? <div className="cs-skeleton mt-8 h-48 rounded-2xl" /> : null}
      {error ? <div className="cs-alert cs-alert--danger mt-8" role="alert">{error}</div> : null}
      {!loading && !error && orders.length === 0 ? (
        <div className="cs-empty-state cs-surface-standard mt-8 rounded-2xl p-10">
          <h2>{t("orders.empty")}</h2>
          <Link className="cs-button" href="/">{t("nav.home")}</Link>
        </div>
      ) : null}
      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <article
            className={`cs-surface-standard flex flex-wrap items-center justify-between gap-5 rounded-2xl p-6${highlightId === order.id ? " ring-2 ring-accent-strong" : ""}`}
            key={order.id}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">#{order.id.slice(0, 10)}</p>
              <p className="mt-2 font-bold">{statusLabel(order.status)}</p>
              <p className="mt-1 text-sm text-muted">{new Date(order.createdAt).toLocaleString(dateLocale)}</p>
              {order.timeline?.length ? <p className="mt-1 text-sm text-muted">{order.timeline[order.timeline.length - 1].label}</p> : null}
            </div>
            <div className="flex items-center gap-4">
              <strong className="text-xl">{formatUsd(order.subtotalUsd, locale)}</strong>
              <Link className="cs-button cs-button--secondary" href={`/ecom/orders/${order.id}`}>{t("orders.detail")}</Link>
            </div>
          </article>
        ))}
      </div>
      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <button className="cs-button cs-button--secondary" disabled={loadingMore} type="button" onClick={() => { void loadMore(); }}>
            {loadingMore ? t("common.loading") : t("storefront.loadMore")}
          </button>
        </div>
      ) : null}
    </main>
  );
}
