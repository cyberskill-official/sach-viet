"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Ticket = { id: string; subject: string; status: string; createdAt: number };
type Message = { id: string; body: string; createdAt: number; userId: string };
type GoodsRequest = { id: string; details: string; status: string; productId: string | null };

async function readJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.location.assign("/login?redirect=/support");
    throw new Error("Unauthenticated.");
  }
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

export function SupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [goodsRequests, setGoodsRequests] = useState<GoodsRequest[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ticketBody, goodsBody] = await Promise.all([
        readJson("/api/support/tickets"),
        readJson("/api/support/goods-requests"),
      ]);
      setTickets(Array.isArray(ticketBody.tickets) ? ticketBody.tickets : []);
      setGoodsRequests(Array.isArray(goodsBody.goodsRequests) ? goodsBody.goodsRequests : []);
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") {
        setError(reason.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    readJson(`/api/support/tickets/${encodeURIComponent(activeId)}/messages`)
      .then((body) => {
        if (!cancelled) setMessages(Array.isArray(body.messages) ? body.messages : []);
      })
      .catch((reason) => {
        if (!cancelled && reason instanceof Error && reason.message !== "Unauthenticated.") {
          setError(reason.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = event.currentTarget;
    const subject = String(new FormData(form).get("subject") || "");
    try {
      const body = await readJson("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject }),
      });
      form.reset();
      if (body.ticket) {
        setTickets((current) => [body.ticket, ...current]);
        setActiveId(body.ticket.id);
        setMessages([]);
      }
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setPending(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeId) return;
    setPending(true);
    setError("");
    const form = event.currentTarget;
    const messageBody = String(new FormData(form).get("body") || "");
    try {
      const body = await readJson(`/api/support/tickets/${encodeURIComponent(activeId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: messageBody }),
      });
      form.reset();
      if (body.message) setMessages((current) => [...current, body.message]);
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setPending(false);
    }
  }

  async function createGoodsRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const body = await readJson("/api/support/goods-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: String(data.get("details") || ""),
          productId: String(data.get("productId") || "").trim() || undefined,
        }),
      });
      form.reset();
      if (body.goodsRequest) setGoodsRequests((current) => [body.goodsRequest, ...current]);
    } catch (reason) {
      if (reason instanceof Error && reason.message !== "Unauthenticated.") setError(reason.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <Link className="text-sm text-accent-strong hover:underline" href="/">← Về cửa hàng</Link>
      <p className="cs-eyebrow mt-8 text-accent-strong">Hỗ trợ</p>
      <h1 className="mt-2 text-4xl font-extrabold">Ticket, yêu cầu hàng, và trao đổi</h1>
      {loading ? <div className="cs-skeleton mt-8 h-40 rounded-2xl" /> : null}
      {error ? <p className="cs-alert cs-alert--danger mt-8" role="alert">{error}</p> : null}

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <form className="cs-surface-standard grid gap-3 rounded-2xl p-6" onSubmit={createTicket}>
          <h2 className="text-xl font-bold">Mở ticket</h2>
          <label className="grid gap-2 text-sm">
            Chủ đề
            <input required name="subject" className="cs-field__control" maxLength={200} />
          </label>
          <button className="cs-button" disabled={pending} type="submit">Gửi ticket</button>
        </form>
        <form className="cs-surface-standard grid gap-3 rounded-2xl p-6" onSubmit={createGoodsRequest}>
          <h2 className="text-xl font-bold">Yêu cầu tìm sách</h2>
          <label className="grid gap-2 text-sm">
            Mô tả
            <textarea required name="details" className="cs-field__control min-h-24" maxLength={2000} />
          </label>
          <label className="grid gap-2 text-sm">
            Mã sản phẩm (tuỳ chọn)
            <input name="productId" className="cs-field__control" />
          </label>
          <button className="cs-button cs-button--secondary" disabled={pending} type="submit">Gửi yêu cầu</button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Ticket của bạn</h2>
        {tickets.length === 0 && !loading ? <p className="mt-3 text-muted">Chưa có ticket.</p> : null}
        <ul className="mt-4 grid gap-2">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <button
                className={`cs-surface-standard w-full rounded-xl p-4 text-left ${activeId === ticket.id ? "ring-2 ring-accent-strong" : ""}`}
                type="button"
                onClick={() => {
                  setActiveId(ticket.id);
                  setMessages([]);
                }}
              >
                <strong>{ticket.subject}</strong>
                <span className="ml-2 text-sm text-muted">{ticket.status}</span>
              </button>
            </li>
          ))}
        </ul>
        {activeId ? (
          <div className="cs-surface-standard mt-4 rounded-2xl p-6">
            <h3 className="font-bold">Tin nhắn</h3>
            <ul className="mt-3 grid gap-2">
              {messages.map((message) => (
                <li key={message.id} className="rounded-lg bg-panel p-3 text-sm">{message.body}</li>
              ))}
            </ul>
            <form className="mt-4 grid gap-3" onSubmit={sendMessage}>
              <label className="grid gap-2 text-sm">
                Trả lời
                <textarea required name="body" className="cs-field__control min-h-20" maxLength={4000} />
              </label>
              <button className="cs-button" disabled={pending} type="submit">Gửi tin</button>
            </form>
          </div>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Yêu cầu hàng</h2>
        {goodsRequests.length === 0 && !loading ? <p className="mt-3 text-muted">Chưa có yêu cầu hàng.</p> : null}
        <ul className="mt-4 grid gap-2">
          {goodsRequests.map((item) => (
            <li key={item.id} className="cs-surface-standard rounded-xl p-4">
              <p>{item.details}</p>
              <p className="mt-1 text-sm text-muted">{item.status}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
