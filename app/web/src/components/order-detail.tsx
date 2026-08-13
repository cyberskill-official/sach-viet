"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/portal-ui-core.mjs";

type TimelineEvent = { at: number; kind: string; label: string; status: string; orderItemId?: string };
type Line = { id: string; title: string; quantity: number; unitPriceUsd: string; fulfillmentStatus?: string | null };
type Order = {
  id: string;
  status: string;
  currency: string;
  subtotalUsd: string;
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
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/orders/${encodeURIComponent(orderId)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (response.status === 401) {
          window.location.assign(`/login?redirect=/ecom/orders/${encodeURIComponent(orderId)}`);
          return;
        }
        if (!response.ok || !body.order) throw new Error(apiMessage(body, "Không thể tải đơn hàng."));
        setOrder(body.order);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Không thể tải đơn hàng.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [orderId]);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <Link className="text-sm text-accent-strong hover:underline" href="/ecom/orders">← Đơn hàng</Link>
      <p className="cs-eyebrow mt-8 text-accent-strong">Tài khoản</p>
      <h1 className="mt-2 text-4xl font-extrabold">Chi tiết đơn hàng</h1>
      {loading ? <div className="cs-skeleton mt-8 h-48 rounded-2xl" /> : null}
      {error ? <p className="cs-alert cs-alert--danger mt-8" role="alert">{error}</p> : null}
      {order ? (
        <section className="cs-surface-standard mt-8 space-y-6 rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">#{order.id.slice(0, 10)}</p>
              <p className="mt-2 font-bold">{order.status}</p>
              <p className="mt-1 text-sm text-muted">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
            </div>
            <strong className="text-2xl">{formatUsd(order.subtotalUsd)}</strong>
          </div>
          <div>
            <h2 className="text-xl font-bold">Dòng hàng</h2>
            <ul className="mt-3 space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="rounded-xl border border-border p-3">
                  <strong>{item.title}</strong>
                  <p className="text-sm text-muted">×{item.quantity} · {formatUsd(item.unitPriceUsd)} · {item.fulfillmentStatus || "chưa đóng gói"}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold">Timeline</h2>
            <ol className="mt-3 space-y-2">
              {order.timeline.map((event, index) => (
                <li key={`${event.kind}-${event.at}-${index}`} className="rounded-xl border border-border p-3">
                  <p className="font-semibold">{event.label}</p>
                  <p className="text-sm text-muted">{new Date(event.at).toLocaleString("vi-VN")} · {event.status}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}
    </main>
  );
}
