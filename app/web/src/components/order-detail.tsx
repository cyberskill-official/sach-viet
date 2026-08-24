"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { formatUsd } from "@/lib/portal-ui-core.mjs";
import { useLocale } from "@/components/locale-provider";
import { LuxuryShell } from "@/components/luxury-shell";

type TimelineEvent = { at: number; kind: string; label: string; status: string; orderItemId?: string };
type Line = { id: string; title: string; quantity: number; unitPriceUsd: string; fulfillmentStatus?: string | null };
type Order = {
  id: string;
  status: string;
  currency: string;
  subtotalUsd: string;
  taxUsd?: string;
  shippingUsd?: string;
  totalUsd?: string;
  expiresAt?: number | null;
  returnsPolicy?: string;
  returnsWindowDays?: number;
  createdAt: number;
  items: Line[];
  timeline: TimelineEvent[];
};

function apiMessage(body: Record<string, unknown>, fallback: string) {
  const error = body.error;
  if (error && typeof error === "object" && error !== null && "message" in error) return String((error as { message: string }).message);
  if (typeof error === "string") return error;
  return fallback;
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const { locale, t } = useLocale();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/orders/${encodeURIComponent(orderId)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (response.status === 401) {
          window.location.assign(`/login?redirect=/ecom/orders/${encodeURIComponent(orderId)}`);
          return;
        }
        if (!response.ok || !body.order) throw new Error(apiMessage(body, t("validation.serverError")));
        setOrder(body.order);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason instanceof Error ? reason.message : t("validation.serverError"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [orderId, t]);

  const pendingHold =
    order?.status === "pending_payment" && typeof order.expiresAt === "number"
      ? new Date(order.expiresAt).toLocaleString(dateLocale)
      : null;

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

  return (
    <LuxuryShell width="lg" tourId="tour.orders">
      <Link className="inline-flex min-h-11 items-center gap-2 text-sm text-accent-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sv-lux-gold-soft,#ca8a04)]" href="/ecom/orders">
        <ArrowLeft size={16} weight="bold" aria-hidden="true" />
        {t("orders.backToOrders")}
      </Link>
      <p className="sv-lux-eyebrow mt-8">{t("nav.account")}</p>
      <h1 className="sv-font-display mt-2 text-4xl tracking-tight">{t("orders.detail")}</h1>
      {loading ? <div className="cs-skeleton mt-8 h-48 rounded-2xl" /> : null}
      {error ? <p className="cs-alert cs-alert--danger mt-8" role="alert">{error}</p> : null}
      {order ? (
        <section className="sv-glass-card mt-8 space-y-6 rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">#{order.id.slice(0, 10)}</p>
              <p className="mt-2 font-bold">{statusLabel(order.status)}</p>
              <p className="mt-1 text-sm text-muted">{t("orders.placedAt")}: {new Date(order.createdAt).toLocaleString(dateLocale)}</p>
              {pendingHold ? (
                <p className="mt-2 text-sm text-muted">{pendingHold}</p>
              ) : null}
            </div>
            <strong className="sv-font-display text-2xl">{formatUsd(order.totalUsd ?? order.subtotalUsd, locale)}</strong>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-border p-3">
              <dt className="text-muted">{t("cart.subtotal")}</dt>
              <dd className="mt-1 font-semibold">{formatUsd(order.subtotalUsd, locale)}</dd>
            </div>
            <div className="rounded-xl border border-border p-3">
              <dt className="text-muted">{t("cart.tax")}</dt>
              <dd className="mt-1 font-semibold">{formatUsd(order.taxUsd ?? "0", locale)}</dd>
            </div>
            <div className="rounded-xl border border-border p-3">
              <dt className="text-muted">{t("cart.shipping")}</dt>
              <dd className="mt-1 font-semibold">{formatUsd(order.shippingUsd ?? "0", locale)}</dd>
            </div>
          </dl>
          <p className="text-sm text-muted">{t("cart.policyPayments")}</p>
          <div>
            <h2 className="sv-font-display text-xl">{t("orders.fulfillment")}</h2>
            <ul className="mt-3 space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="rounded-xl border border-border p-3">
                  <strong>{item.title}</strong>
                  <p className="text-sm text-muted">×{item.quantity} · {formatUsd(item.unitPriceUsd, locale)} · {item.fulfillmentStatus || t("orders.notPacked")}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="sv-font-display text-xl">{t("orders.status")}</h2>
            <ol className="mt-3 space-y-2">
              {order.timeline.map((event, index) => (
                <li key={`${event.kind}-${event.at}-${index}`} className="rounded-xl border border-border p-3">
                  <p className="font-semibold">{event.label}</p>
                  <p className="text-sm text-muted">{new Date(event.at).toLocaleString(dateLocale)} · {event.status}</p>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-sm text-muted">
            <Link className="text-accent-strong hover:underline" href="/support">{t("orders.openSupport")}</Link>
            {" · "}
            <Link className="text-accent-strong hover:underline" href="/account">{t("nav.account")}</Link>
          </p>
        </section>
      ) : null}
    </LuxuryShell>
  );
}
