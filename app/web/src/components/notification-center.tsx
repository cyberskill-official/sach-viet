"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { mergeNotifications } from "@/lib/portal-ui-core.mjs";

type Notification = { id: string; title: string; body: string; deeplinkPath: string; isRead: boolean; createdAt: number };

export function NotificationCenter({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const failures = useRef(0);

  useEffect(() => {
    let source: EventSource | null = null;
    let cancelled = false;
    fetch("/api/notifications")
      .then(async (response) => {
        if (response.status === 401) return null;
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Notifications are unavailable.");
        setItems(body.notifications || []);
        setUnread(Number(body.unreadCount || 0));
        return body;
      })
      .then((body) => {
        if (!body || cancelled) return;
        source = new EventSource("/api/notifications/stream");
        source.addEventListener("notification", (event) => {
          const incoming = JSON.parse((event as MessageEvent).data);
          setItems((current) => mergeNotifications(current, [incoming]));
          setUnread(Number(incoming.unreadCount || 0));
          failures.current = 0;
        });
        source.onerror = () => {
          failures.current += 1;
          if (failures.current >= 5) {
            source?.close();
            setError(locale === "vi" ? "Cập nhật trực tiếp đang tạm dừng." : "Live updates are paused.");
          }
        };
      })
      .catch((reason) => setError(reason.message));
    return () => { cancelled = true; source?.close(); };
  }, [locale]);

  async function markRead(notification: Notification) {
    if (notification.isRead) return;
    const response = await fetch(`/api/notifications/${encodeURIComponent(notification.id)}/read`, { method: "POST" });
    if (!response.ok) { setError(locale === "vi" ? "Chưa thể đánh dấu đã đọc." : "Could not mark as read."); return; }
    setItems((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
    setUnread((value) => Math.max(0, value - 1));
  }

  return (
    <div className="relative">
      <button aria-expanded={open} aria-label={locale === "vi" ? "Thông báo" : "Notifications"} className="cs-button cs-button--ghost relative" onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">Thông báo</span>{unread > 0 ? <span className="ml-2 rounded-full bg-accent-strong px-2 py-0.5 text-xs text-white">{unread > 99 ? "99+" : unread}</span> : null}
      </button>
      {open ? <section className="cs-surface-heavy absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between"><h2 className="font-bold">{locale === "vi" ? "Thông báo" : "Notifications"}</h2><button className="cs-button cs-button--ghost" onClick={() => setOpen(false)}>×</button></div>
        {error ? <p className="cs-alert cs-alert--warning mt-3 text-sm" role="status">{error}</p> : null}
        <div className="mt-3 max-h-96 space-y-2 overflow-auto">
          {items.length === 0 ? <p className="py-8 text-center text-sm text-muted">{locale === "vi" ? "Chưa có thông báo." : "No notifications yet."}</p> : items.map((item) => (
            <Link href={item.deeplinkPath} key={item.id} onClick={() => { void markRead(item); setOpen(false); }} className={`block rounded-xl border p-3 ${item.isRead ? "border-border" : "border-accent bg-accent-tint"}`}>
              <p className="font-semibold">{item.title}</p><p className="mt-1 text-sm text-muted">{item.body}</p>
            </Link>
          ))}
        </div>
      </section> : null}
    </div>
  );
}
