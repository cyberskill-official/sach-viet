"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { formatUsd } from "@/lib/portal-ui-core.mjs";

type Row = { id: string; label: string };

async function readJson(url: string) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

function rowsFrom(items: unknown, map: (item: Record<string, unknown>) => Row): Row[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => map(item as Record<string, unknown>));
}

export function RolePortalPanel({
  portal,
  locale,
  emptyLabel,
  previousLabel,
  nextLabel,
}: {
  portal: string;
  locale: string;
  emptyLabel: string;
  previousLabel: string;
  nextLabel: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const vi = locale === "vi";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (portal === "vendor") {
        const [dashboard, orders, payouts] = await Promise.all([
          readJson("/api/vendor/dashboard"),
          readJson("/api/vendor/orders"),
          readJson("/api/vendor/payouts"),
        ]);
        const dash = dashboard.dashboard || {};
        setSummary(
          vi
            ? `Đơn vào: ${dash.incomingOrderLineCount ?? 0} · Đã trả: ${formatUsd(dash.paidLineTotalUsd || "0")} · Chi trả: ${dash.payoutCount ?? 0}`
            : `Incoming lines: ${dash.incomingOrderLineCount ?? 0} · Paid: ${formatUsd(dash.paidLineTotalUsd || "0")} · Payouts: ${dash.payoutCount ?? 0}`,
        );
        setRows([
          ...rowsFrom(orders.orders, (item) => ({
            id: String(item.orderItemId || item.orderId),
            label: `${item.title || item.orderId} · ${item.status} · ×${item.quantity}`,
          })),
          ...rowsFrom(payouts.payouts, (item) => ({
            id: String(item.id),
            label: `${vi ? "Chi trả" : "Payout"} ${formatUsd(String(item.amountUsd || "0"))}`,
          })),
        ]);
      } else if (portal === "employee") {
        const [dashboard, sections, tickets] = await Promise.all([
          readJson("/api/employee/dashboard"),
          readJson("/api/employee/home-sections"),
          readJson("/api/support/tickets").catch(() => ({ tickets: [] })),
        ]);
        const dash = dashboard.dashboard || {};
        setSummary(
          vi
            ? `Đơn: ${dash.orderCount ?? 0} · Ticket: ${dash.openTicketCount ?? 0} · Đơn vendor: ${dash.pendingVendorApplicationCount ?? 0}`
            : `Orders: ${dash.orderCount ?? 0} · Tickets: ${dash.openTicketCount ?? 0} · Vendor apps: ${dash.pendingVendorApplicationCount ?? 0}`,
        );
        setRows([
          ...rowsFrom(sections.sections, (item) => ({ id: String(item.id), label: `${item.sectionKey}: ${item.title}` })),
          ...rowsFrom(tickets.tickets, (item) => ({ id: String(item.id), label: `Ticket · ${item.subject} · ${item.status}` })),
        ]);
      } else if (portal === "retail") {
        const body = await readJson("/api/retail/orders");
        setSummary(vi ? "Đơn bán lẻ" : "Retail orders");
        setRows(rowsFrom(body.orders, (item) => ({ id: String(item.id), label: `${item.id} · ${item.status} · ${formatUsd(String(item.subtotalUsd || "0"))}` })));
      } else if (portal === "b2b") {
        const body = await readJson("/api/b2b/quotes/pipeline");
        const pipeline = body.pipeline || {};
        const combined = Object.entries(pipeline).flatMap(([status, list]) =>
          rowsFrom(list, (item) => ({ id: String(item.id), label: `${status} · ${item.id}` })),
        );
        setSummary(vi ? "Pipeline báo giá B2B" : "B2B quote pipeline");
        setRows(combined);
      } else if (portal === "institution") {
        const [quotes, budget] = await Promise.all([
          readJson("/api/institution/quotes"),
          readJson("/api/institution/budget").catch(() => ({ budget: null })),
        ]);
        setSummary(
          budget.budget
            ? `${vi ? "Ngân sách" : "Budget"} ${formatUsd(String(budget.budget.amountUsd || "0"))}`
            : vi
              ? "Báo giá tổ chức"
              : "Institution quotes",
        );
        setRows(rowsFrom(quotes.quotes, (item) => ({ id: String(item.id), label: `${item.status} · ${item.id}` })));
      } else if (portal === "publisher") {
        const body = await readJson("/api/publisher/publishing-requests");
        setSummary(vi ? "Yêu cầu xuất bản (tài chính đang chờ DEC)" : "Publishing requests (finance gated)");
        setRows(rowsFrom(body.publishingRequests, (item) => ({ id: String(item.id), label: `${item.title} · ${item.status}` })));
      } else if (portal === "author") {
        const body = await readJson("/api/author/manuscript-requests");
        setSummary(vi ? "Bản thảo (thu nhập đang chờ DEC)" : "Manuscripts (earnings gated)");
        setRows(rowsFrom(body.manuscriptRequests, (item) => ({ id: String(item.id), label: `${item.title} · ${item.status}` })));
      } else if (portal === "supplier") {
        setSummary(vi ? "Cổng nhà cung cấp đang chờ phạm vi sản phẩm." : "Supplier portal scope is still on hold.");
        setRows([]);
      } else {
        setRows([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Portal data is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [portal, vi]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading) return <p className="mt-5 text-sm text-muted">{vi ? "Đang tải…" : "Loading…"}</p>;
  if (error) return <p className="cs-alert cs-alert--danger mt-5" role="alert">{error}</p>;
  return (
    <div className="mt-5">
      {summary ? <p className="text-sm text-muted">{summary}</p> : null}
      <DataTable labels={{ empty: emptyLabel, previous: previousLabel, next: nextLabel }} rows={rows} />
    </div>
  );
}
