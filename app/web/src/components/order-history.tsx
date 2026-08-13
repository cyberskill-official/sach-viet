"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/portal-ui-core.mjs";

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

const statusLabel: Record<string, string> = {
  pending_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  payment_failed: "Thanh toán chưa thành công",
};

export function OrderHistory({ highlightId }: { highlightId?: string } = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 50;

  useEffect(() => {
    fetch(`/api/orders?limit=${pageSize}`)
      .then(async (response) => {
        const body = await response.json();
        if (response.status === 401) { window.location.assign("/login?redirect=/ecom/orders"); return; }
        const items = orderItems(body);
        if (!response.ok) throw new Error(apiMessage(body, "Không thể tải đơn hàng."));
        setOrders(items);
        setHasMore(Boolean(body.nextCursor) || items.length === pageSize);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    if (loadingMore || !hasMore || orders.length === 0) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/orders?limit=${pageSize}&after=${encodeURIComponent(orders[orders.length - 1].id)}`);
      const body = await response.json();
      const items = orderItems(body);
      if (!response.ok) throw new Error(apiMessage(body, "Không thể tải đơn hàng."));
      setOrders((current) => [...current, ...items]);
      setHasMore(Boolean(body.nextCursor) || items.length === pageSize);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải đơn hàng.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <Link className="text-sm text-accent-strong hover:underline" href="/">← Về cửa hàng</Link>
      <p className="cs-eyebrow mt-8 text-accent-strong">Tài khoản</p><h1 className="mt-2 text-4xl font-extrabold">Đơn hàng của tôi</h1>
      {loading ? <div className="cs-skeleton mt-8 h-48 rounded-2xl" /> : null}
      {error ? <div className="cs-alert cs-alert--danger mt-8" role="alert">{error}</div> : null}
      {!loading && !error && orders.length === 0 ? <div className="cs-empty-state cs-surface-standard mt-8 rounded-2xl p-10"><h2>Chưa có đơn hàng</h2><p>Khi bạn hoàn tất đặt sách, đơn hàng sẽ xuất hiện tại đây.</p><Link className="cs-button" href="/">Chọn sách</Link></div> : null}
      <div className="mt-8 space-y-4">{orders.map((order) => <article className={`cs-surface-standard flex flex-wrap items-center justify-between gap-5 rounded-2xl p-6${highlightId === order.id ? " ring-2 ring-accent-strong" : ""}`} key={order.id}><div><p className="text-xs font-semibold uppercase tracking-wider text-muted">#{order.id.slice(0, 10)}</p><p className="mt-2 font-bold">{statusLabel[order.status] || order.status}</p><p className="mt-1 text-sm text-muted">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>{order.timeline?.length ? <p className="mt-1 text-sm text-muted">{order.timeline[order.timeline.length - 1].label}</p> : null}</div><div className="flex items-center gap-4"><strong className="text-xl">{formatUsd(order.subtotalUsd)}</strong><Link className="cs-button cs-button--secondary" href={`/ecom/orders/${order.id}`}>Chi tiết</Link></div></article>)}</div>
      {hasMore ? <div className="mt-6 flex justify-center"><button className="cs-button cs-button--secondary" disabled={loadingMore} type="button" onClick={() => { void loadMore(); }}>{loadingMore ? "Đang tải…" : "Xem thêm"}</button></div> : null}
    </main>
  );
}
