"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { formatUsd } from "@/lib/portal-ui-core.mjs";

type Row = { id: string; label: string; kind?: "offer" | "order" | "ticket" | "quote" | "request" | "marc" };

function apiMessage(body: Record<string, unknown>, fallback: string) {
  const error = body.error;
  if (error && typeof error === "object" && error !== null && "message" in error) return String((error as { message: string }).message);
  if (typeof error === "string") return error;
  return fallback;
}

async function readJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(apiMessage(body, `Request failed (${response.status}).`));
  return body;
}

function listItems(body: Record<string, unknown>, fallbackKeys: string[]) {
  if (Array.isArray(body.items)) return body.items as Record<string, unknown>[];
  for (const key of fallbackKeys) {
    if (Array.isArray(body[key])) return body[key] as Record<string, unknown>[];
  }
  return [];
}

async function uploadBytes(file: File) {
  const buffer = await file.arrayBuffer();
  const bytesBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const body = await readJson("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bytesBase64, contentType: file.type || "application/octet-stream" }),
  });
  return String(body.object?.key || "");
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
  const [policyNote, setPolicyNote] = useState("");
  const [financeNote, setFinanceNote] = useState("");
  const [extraRows, setExtraRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [offerForm, setOfferForm] = useState({ id: "", productId: "", priceUsd: "", stockQuantity: "1" });
  const [selectedQuote, setSelectedQuote] = useState("");
  const [quoteDetail, setQuoteDetail] = useState<Record<string, unknown> | null>(null);
  const vi = locale === "vi";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPolicyNote("");
    setFinanceNote("");
    setExtraRows([]);
    try {
      const policy = await readJson("/api/finance/policy").catch(() => null);
      if (portal === "vendor") {
        const [dashboard, orders, offers, payouts] = await Promise.all([
          readJson("/api/vendor/dashboard"),
          readJson("/api/vendor/orders"),
          readJson("/api/vendor/offers"),
          readJson("/api/vendor/payouts").catch(() => ({ payouts: [] })),
        ]);
        const dash = dashboard.dashboard || {};
        setSummary(
          vi
            ? `Đơn vào: ${dash.incomingOrderLineCount ?? 0} · Đã trả: ${formatUsd(dash.paidLineTotalUsd || "0")} · Sổ chi trả: ${dash.payoutCount ?? 0}`
            : `Incoming lines: ${dash.incomingOrderLineCount ?? 0} · Paid: ${formatUsd(dash.paidLineTotalUsd || "0")} · Payout ledger: ${dash.payoutCount ?? 0}`,
        );
        setPolicyNote(policy?.policy?.settlement?.message
          || (vi
            ? "Đối soát: DEC-SET interim 15% hoa hồng, reserve 0, weekly, $50, manual/sandbox."
            : "Settlement: DEC-SET interim 15% commission, reserve 0, weekly, $50, manual/sandbox."));
        setRows([
          ...listItems(offers, ["offers"]).map((item) => ({
            id: String(item.id),
            kind: "offer" as const,
            label: `${item.productTitle || item.productSlug} · ${formatUsd(String(item.priceUsd || "0"))} · ${item.stockQuantity}`,
          })),
          ...listItems(orders, ["orders"]).map((item) => ({
            id: String(item.orderItemId || item.orderId),
            kind: "order" as const,
            label: `${item.title || item.orderId} · ${item.status} · ${item.fulfillmentStatus || "—"} · ×${item.quantity}`,
          })),
        ]);
        setExtraRows(listItems(payouts, ["payouts"]).map((item) => ({
          id: String(item.id),
          kind: "order" as const,
          label: `payout · ${formatUsd(String(item.amountUsd || "0"))} · ${Array.isArray(item.orderItemIds) ? item.orderItemIds.length : 0} lines`,
        })));
      } else if (portal === "employee") {
        const [dashboard, tickets, sections] = await Promise.all([
          readJson("/api/employee/dashboard"),
          readJson("/api/support/tickets"),
          readJson("/api/employee/home-sections").catch(() => ({ sections: [] })),
        ]);
        const dash = dashboard.dashboard || {};
        setSummary(
          vi
            ? `Đơn: ${dash.orderCount ?? 0} · Ticket: ${dash.openTicketCount ?? 0} · Đơn vendor: ${dash.pendingVendorApplicationCount ?? 0}`
            : `Orders: ${dash.orderCount ?? 0} · Tickets: ${dash.openTicketCount ?? 0} · Vendor apps: ${dash.pendingVendorApplicationCount ?? 0}`,
        );
        setRows(listItems(tickets, ["tickets"]).map((item) => ({
          id: String(item.id),
          kind: "ticket" as const,
          label: `${item.subject} · ${item.status} · assignee ${item.assigneeId || "—"}`,
        })));
        setExtraRows(listItems(sections, ["sections"]).map((item, index) => ({
          id: String(item.id || item.key || item.slug || `section-${index}`),
          label: `home · ${item.title || item.key || item.id}`,
        })));
      } else if (portal === "retail") {
        const body = await readJson("/api/retail/orders");
        setSummary(vi ? "Đơn bán lẻ đã thanh toán" : "Paid retail orders");
        setRows(listItems(body, ["orders"]).flatMap((item) => {
          const lines = Array.isArray(item.items) ? item.items as Array<{ id: string; title?: string; fulfillmentStatus?: string }> : [];
          if (!lines.length) {
            return [{ id: String(item.id), kind: "order" as const, label: `${item.id} · ${item.status} · ${formatUsd(String(item.subtotalUsd || "0"))}` }];
          }
          return lines.map((line) => ({
            id: String(line.id),
            kind: "order" as const,
            label: `${line.title || item.id} · ${item.status} · ${line.fulfillmentStatus || "—"}`,
          }));
        }));
      } else if (portal === "b2b") {
        const [body] = await Promise.all([
          readJson("/api/b2b/quotes/pipeline"),
        ]);
        const pipeline = body.pipeline || {};
        const combined = Object.entries(pipeline).flatMap(([status, list]) =>
          (Array.isArray(list) ? list : []).map((item) => ({
            id: String((item as { id: string }).id),
            label: `${status} · ${(item as { id: string }).id}`,
          })),
        );
        setSummary(vi ? "Pipeline báo giá B2B (vận hành)" : "B2B quote pipeline (operational)");
        setPolicyNote(policy?.policy?.b2b?.message
          || (vi
            ? "B2B: hiệu lực 30 ngày, Net-30, chiết khấu admin tối đa 20% (DEC-B2B interim)."
            : "B2B: quote validity 30d, Net-30, admin discount max 20% (DEC-B2B interim)."));
        setRows(combined);
      } else if (portal === "institution") {
        const [quotes, orders, budget] = await Promise.all([
          readJson("/api/institution/quotes"),
          readJson("/api/institution/orders").catch(() => ({ orders: [], items: [] })),
          readJson("/api/institution/budget").catch(() => ({ budget: null })),
        ]);
        const budgetRow = budget.budget;
        setSummary(vi ? "Báo giá và đơn tổ chức" : "Institution quotes and orders");
        setPolicyNote(policy?.policy?.b2b?.message
          || (vi
            ? "Điều khoản B2B/institution: Net-30 + hiệu lực báo giá 30 ngày (DEC-B2B interim)."
            : "B2B/institution terms: Net-30 + quote validity 30d (DEC-B2B interim)."));
        if (budgetRow) {
          setFinanceNote(vi
            ? `Ngân sách (informational): ${formatUsd(String(budgetRow.amountUsd || budgetRow.limitUsd || "0"))}`
            : `Budget (informational): ${formatUsd(String(budgetRow.amountUsd || budgetRow.limitUsd || "0"))}`);
        }
        setRows([
          ...listItems(quotes, ["quotes"]).map((item) => ({ id: String(item.id), kind: "quote" as const, label: `quote · ${item.status} · ${item.id}` })),
          ...listItems(orders, ["orders"]).map((item) => ({ id: String(item.id), kind: "order" as const, label: `order · ${item.status} · ${item.id}` })),
        ]);
      } else if (portal === "publisher") {
        const [requests, marc, dashboard] = await Promise.all([
          readJson("/api/publisher/publishing-requests"),
          readJson("/api/publisher/marc").catch(() => ({ marcRecords: [] })),
          readJson("/api/publisher/dashboard").catch(() => ({ dashboard: null })),
        ]);
        const dash = dashboard.dashboard || {};
        setSummary(vi
          ? `Yêu cầu: ${Array.isArray(requests.publishingRequests) ? requests.publishingRequests.length : 0} · MARC: ${Array.isArray(marc.marcRecords) ? marc.marcRecords.length : 0}`
          : `Requests: ${Array.isArray(requests.publishingRequests) ? requests.publishingRequests.length : 0} · MARC: ${Array.isArray(marc.marcRecords) ? marc.marcRecords.length : 0}`);
        setPolicyNote(policy?.policy?.royalty?.message
          || (vi
            ? "Royalty: DEC-ROY interim 10% author / quý — không advances."
            : "Royalties: DEC-ROY interim 10% author / quarterly — no advances."));
        if (dash.royalties?.policyPending || dash.sales?.policyPending) {
          setFinanceNote(vi
            ? "Dashboard: compute preview qua finance policy (DEC-ROY interim)."
            : "Dashboard: compute preview via finance policy (DEC-ROY interim).");
        }
        setRows([
          ...(Array.isArray(requests.publishingRequests) ? requests.publishingRequests : []).map((item: { id: string; title: string; status: string }) => ({
            id: item.id,
            kind: "request" as const,
            label: `${item.title} · ${item.status}`,
          })),
          ...(Array.isArray(marc.marcRecords) ? marc.marcRecords : []).map((item: { productId: string }) => ({
            id: item.productId,
            kind: "marc" as const,
            label: `MARC · ${item.productId}`,
          })),
        ]);
      } else if (portal === "author") {
        const [body, dashboard] = await Promise.all([
          readJson("/api/author/manuscript-requests"),
          readJson("/api/author/dashboard").catch(() => ({ dashboard: null })),
        ]);
        const dash = dashboard.dashboard || {};
        setSummary(vi ? "Bản thảo (vận hành)" : "Manuscripts (operational)");
        setPolicyNote(policy?.policy?.royalty?.message
          || (vi
            ? "Thu nhập: DEC-ROY interim 10% / quý."
            : "Earnings: DEC-ROY interim 10% / quarterly."));
        if (dash.earnings?.policyPending || dash.stages?.policyPending) {
          setFinanceNote(vi
            ? "Earnings: dùng finance compute preview (DEC-ROY interim)."
            : "Earnings: use finance compute preview (DEC-ROY interim).");
        }
        setRows((Array.isArray(body.manuscriptRequests) ? body.manuscriptRequests : []).map((item: { id: string; title: string; status: string }) => ({
          id: item.id,
          kind: "request" as const,
          label: `${item.title} · ${item.status}`,
        })));
      } else if (portal === "supplier") {
        setSummary(vi ? "Cổng nhà cung cấp không còn trên Production UI." : "Supplier portal is retired from Production UI.");
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

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("offer");
    setError("");
    try {
      await readJson("/api/vendor/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: offerForm.id || undefined,
          productId: offerForm.productId,
          priceUsd: offerForm.priceUsd,
          stockQuantity: Number(offerForm.stockQuantity),
          isActive: true,
        }),
      });
      setOfferForm({ id: "", productId: "", priceUsd: "", stockQuantity: "1" });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Offer write failed.");
    } finally {
      setBusy("");
    }
  }

  async function markFulfillment(orderItemId: string, fulfillmentStatus: string, url: string) {
    setBusy(orderItemId);
    setError("");
    try {
      await readJson(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId, fulfillmentStatus }),
      });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Fulfillment update failed.");
    } finally {
      setBusy("");
    }
  }

  async function assignSelected(ticketId: string) {
    setBusy(ticketId);
    setError("");
    try {
      const me = await readJson("/api/auth/me");
      await readJson(`/api/support/tickets/${encodeURIComponent(ticketId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: me.user?.id }),
      });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Assignment failed.");
    } finally {
      setBusy("");
    }
  }

  async function loadQuote(id: string) {
    setSelectedQuote(id);
    setError("");
    try {
      const body = await readJson(`/api/b2b/quotes/${encodeURIComponent(id)}`);
      setQuoteDetail(body.quote || null);
    } catch (reason) {
      setQuoteDetail(null);
      setError(reason instanceof Error ? reason.message : "Quote is unavailable.");
    }
  }

  async function convertQuote() {
    if (!selectedQuote) return;
    setBusy("convert");
    setError("");
    try {
      await readJson("/api/b2b/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: selectedQuote }),
      });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Convert failed.");
    } finally {
      setBusy("");
    }
  }

  async function uploadPo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const orderId = String(new FormData(form).get("orderId") || "");
    const reference = String(new FormData(form).get("referenceNumber") || "");
    const file = (form.elements.namedItem("po") as HTMLInputElement | null)?.files?.[0];
    if (!file) return;
    setBusy("po");
    setError("");
    try {
      const storageKey = await uploadBytes(file);
      await readJson(`/api/institution/orders/${encodeURIComponent(orderId)}/purchase-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceNumber: reference, storageKey }),
      });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "PO upload failed.");
    } finally {
      setBusy("");
    }
  }

  async function createPublisherRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = String(new FormData(form).get("title") || "");
    const file = (form.elements.namedItem("asset") as HTMLInputElement | null)?.files?.[0];
    if (!file) return;
    setBusy("request");
    setError("");
    try {
      const storageKey = await uploadBytes(file);
      const url = portal === "author" ? "/api/author/manuscript-requests" : "/api/publisher/publishing-requests";
      await readJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, storageKey }),
      });
      form.reset();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Request failed.");
    } finally {
      setBusy("");
    }
  }

  async function withdrawRequest(id: string) {
    setBusy(id);
    setError("");
    try {
      const url = portal === "author"
        ? `/api/author/manuscript-requests/${encodeURIComponent(id)}/withdraw`
        : `/api/publisher/publishing-requests/${encodeURIComponent(id)}/withdraw`;
      await readJson(url, { method: "POST" });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Withdraw failed.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <p className="mt-5 text-sm text-muted">{vi ? "Đang tải…" : "Loading…"}</p>;
  if (error) return <p className="cs-alert cs-alert--danger mt-5" role="alert">{error}</p>;
  return (
    <div className="mt-5 space-y-6">
      {summary ? <p className="text-sm text-muted">{summary}</p> : null}
      {policyNote ? (
        <div className="cs-alert cs-alert--warning" id="finance">
          <strong>{vi ? "Chính sách tài chính đang chờ DEC" : "Finance policy pending DEC"}</strong>
          <p className="mt-1 text-sm">{policyNote}</p>
        </div>
      ) : null}
      {financeNote ? <p className="text-sm text-muted" id="budget">{financeNote}</p> : null}

      {portal === "vendor" ? (
        <form id="offers" className="cs-surface-standard space-y-3 rounded-2xl p-4" onSubmit={(event) => { void saveOffer(event); }}>
          <h3 className="font-semibold">{vi ? "Tạo / sửa chào bán" : "Create or edit offer"}</h3>
          <input aria-label="Offer ID" className="cs-field__control w-full" placeholder="Offer ID (edit)" value={offerForm.id} onChange={(event) => setOfferForm((current) => ({ ...current, id: event.target.value }))} />
          <input required aria-label="Product ID" className="cs-field__control w-full" placeholder="Product ID" value={offerForm.productId} onChange={(event) => setOfferForm((current) => ({ ...current, productId: event.target.value }))} />
          <input required aria-label="Price USD" className="cs-field__control w-full" placeholder="Price USD" value={offerForm.priceUsd} onChange={(event) => setOfferForm((current) => ({ ...current, priceUsd: event.target.value }))} />
          <input required aria-label="Stock" className="cs-field__control w-full" placeholder="Stock" value={offerForm.stockQuantity} onChange={(event) => setOfferForm((current) => ({ ...current, stockQuantity: event.target.value }))} />
          <button disabled={busy === "offer"} className="cs-button" type="submit">{vi ? "Lưu chào bán" : "Save offer"}</button>
        </form>
      ) : null}

      {portal === "vendor" || portal === "retail" ? (
        <div id="orders" className="space-y-2">
          <p className="text-sm text-muted">{vi ? "Ghi chú fulfillment (packing / shipped / delivered) — không phải hợp đồng vận chuyển." : "Fulfillment overlay notes only — not a shipping contract."}</p>
          {rows.filter((row) => row.kind === "order").slice(0, 12).map((row) => (
            <div className="flex flex-wrap gap-2" key={`f-${row.id}`}>
              <button className="cs-button cs-button--secondary" disabled={busy === row.id} onClick={() => void markFulfillment(row.id, "packing", portal === "retail" ? "/api/retail/orders" : "/api/vendor/orders")}>packing</button>
              <button className="cs-button cs-button--secondary" disabled={busy === row.id} onClick={() => void markFulfillment(row.id, "shipped", portal === "retail" ? "/api/retail/orders" : "/api/vendor/orders")}>shipped</button>
              {portal === "retail" ? <button className="cs-button cs-button--secondary" disabled={busy === row.id} onClick={() => void markFulfillment(row.id, "delivered", "/api/retail/orders")}>delivered</button> : null}
            </div>
          ))}
        </div>
      ) : null}

      {portal === "employee" ? (
        <div id="tickets" className="space-y-2">
          <p className="text-sm text-muted">{vi ? "Gán ticket cho chính bạn." : "Assign a ticket to yourself."}</p>
          {rows.map((row) => (
            <button key={`a-${row.id}`} className="cs-button cs-button--secondary" disabled={busy === row.id} onClick={() => void assignSelected(row.id)}>
              {vi ? "Gán cho tôi" : "Assign to me"} · {row.id.slice(0, 8)}
            </button>
          ))}
        </div>
      ) : null}

      {portal === "employee" && extraRows.length ? (
        <div id="home" className="space-y-2">
          <h3 className="font-semibold">{vi ? "Cấu hình trang chủ (đọc)" : "Home sections (read)"}</h3>
          <DataTable labels={{ empty: emptyLabel, previous: previousLabel, next: nextLabel }} rows={extraRows} />
        </div>
      ) : null}

      {portal === "vendor" && extraRows.length ? (
        <div id="payouts" className="space-y-2">
          <h3 className="font-semibold">{vi ? "Sổ chi trả (vận hành, không phải settlement DEC-SET)" : "Payout ledger (operational, not DEC-SET settlement)"}</h3>
          <DataTable labels={{ empty: emptyLabel, previous: previousLabel, next: nextLabel }} rows={extraRows} />
        </div>
      ) : null}

      {portal === "b2b" ? (
        <div id="pipeline" className="space-y-3">
          <label className="block text-sm">
            {vi ? "Chi tiết báo giá" : "Quote detail"}
            <select aria-label="Quote" className="cs-field__control mt-1 w-full" value={selectedQuote} onChange={(event) => { void loadQuote(event.target.value); }}>
              <option value="">{vi ? "Chọn báo giá" : "Select quote"}</option>
              {rows.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}
            </select>
          </label>
          {quoteDetail ? <pre className="overflow-auto rounded-xl border border-border p-3 text-xs">{JSON.stringify(quoteDetail, null, 2)}</pre> : null}
          <button className="cs-button" disabled={!selectedQuote || busy === "convert"} onClick={() => void convertQuote()}>{vi ? "Chuyển thành đơn" : "Convert to order"}</button>
        </div>
      ) : null}

      {portal === "institution" ? (
        <form id="orders" className="space-y-3" onSubmit={(event) => { void uploadPo(event); }}>
          <h3 className="font-semibold">{vi ? "Tải PO (stored_objects)" : "Upload PO (stored_objects)"}</h3>
          <input required aria-label="Order ID" name="orderId" className="cs-field__control w-full" placeholder="Order ID" />
          <input required aria-label="PO reference" name="referenceNumber" className="cs-field__control w-full" placeholder="PO-1001" />
          <input required aria-label="PO file" name="po" type="file" className="cs-field__control w-full" />
          <button disabled={busy === "po"} className="cs-button" type="submit">{vi ? "Gửi PO" : "Submit PO"}</button>
        </form>
      ) : null}

      {portal === "publisher" || portal === "author" ? (
        <div id="requests" className="space-y-3">
          <form className="space-y-3" onSubmit={(event) => { void createPublisherRequest(event); }}>
            <input required aria-label="Title" name="title" className="cs-field__control w-full" placeholder={vi ? "Tiêu đề" : "Title"} />
            <input required aria-label="Asset" name="asset" type="file" className="cs-field__control w-full" />
            <button disabled={busy === "request"} className="cs-button" type="submit">{vi ? "Gửi yêu cầu" : "Submit request"}</button>
          </form>
          {rows.filter((row) => !row.label.startsWith("MARC")).map((row) => (
            <button key={`w-${row.id}`} className="cs-button cs-button--secondary" disabled={busy === row.id} onClick={() => void withdrawRequest(row.id)}>
              {vi ? "Rút" : "Withdraw"} · {row.label}
            </button>
          ))}
        </div>
      ) : null}

      <DataTable labels={{ empty: emptyLabel, previous: previousLabel, next: nextLabel }} rows={rows} />
    </div>
  );
}
