"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/portal-ui-core.mjs";

type Order = { id: string; status: string; currency: string; subtotalUsd: string; createdAt: number };

const statusLabel: Record<string, string> = {
  pending_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  payment_failed: "Thanh toán chưa thành công",
};

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then(async (response) => {
        const body = await response.json();
        if (response.status === 401) { window.location.assign("/login?redirect=/ecom/orders"); return; }
        if (!response.ok || !Array.isArray(body.orders)) throw new Error(body.error || "Không thể tải đơn hàng.");
        setOrders(body.orders);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <Link className="text-sm text-accent-strong hover:underline" href="/">← Về cửa hàng</Link>
      <p className="cs-eyebrow mt-8 text-accent-strong">Tài khoản</p><h1 className="mt-2 text-4xl font-extrabold">Đơn hàng của tôi</h1>
      {loading ? <div className="cs-skeleton mt-8 h-48 rounded-2xl" /> : null}
      {error ? <div className="cs-alert cs-alert--danger mt-8" role="alert">{error}</div> : null}
      {!loading && !error && orders.length === 0 ? <div className="cs-empty-state cs-surface-standard mt-8 rounded-2xl p-10"><h2>Chưa có đơn hàng</h2><p>Khi bạn hoàn tất đặt sách, đơn hàng sẽ xuất hiện tại đây.</p><Link className="cs-button" href="/">Chọn sách</Link></div> : null}
      <div className="mt-8 space-y-4">{orders.map((order) => <article className="cs-surface-standard flex flex-wrap items-center justify-between gap-5 rounded-2xl p-6" key={order.id}><div><p className="text-xs font-semibold uppercase tracking-wider text-muted">#{order.id.slice(0, 10)}</p><p className="mt-2 font-bold">{statusLabel[order.status] || order.status}</p><p className="mt-1 text-sm text-muted">{new Date(order.createdAt).toLocaleString("vi-VN")}</p></div><strong className="text-xl">{formatUsd(order.subtotalUsd)}</strong></article>)}</div>
    </main>
  );
}
