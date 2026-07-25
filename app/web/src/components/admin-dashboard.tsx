"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminAiPanel } from "@/components/admin-ai-panel";
import { formatUsd } from "@/lib/portal-ui-core.mjs";

type Dashboard = { orderCount: number; paidOrderCount: number; paidRevenueUsd: string; recentOrders: Array<{ id: string; status: string; subtotalUsd: string; createdAt: number }> };
type Application = { id: string; userId: string; status: string; rejectionReason?: string | null; createdAt: number };
type Payout = { id: string; vendorId: string; amountUsd: string; orderItemIds: string[]; createdAt: number };
type ImportStatus = { adapter: string; runtime: string; mysqlClient: boolean; wordpressPhpRuntime: boolean; recentRuns: Array<{ id: string; mode: string; acceptedCount: number; skippedCount: number; unmatchedCount: number; rejectedCount: number; createdAt: number }> };

async function readJson(url: string) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardBody, applicationsBody, payoutsBody, importBody] = await Promise.all([
        readJson("/api/admin/commerce/dashboard"),
        readJson("/api/admin/vendor-applications"),
        readJson("/api/admin/payouts"),
        readJson("/api/admin/wordpress-import/status"),
      ]);
      setDashboard(dashboardBody.dashboard);
      setApplications(applicationsBody.applications || []);
      setPayouts(payoutsBody.payouts || []);
      setImportStatus(importBody.status);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Admin data is unavailable."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function decide(application: Application, decision: "approved" | "rejected") {
    const rejectionReason = reasons[application.id]?.trim();
    if (decision === "rejected" && !rejectionReason) { setError("Vui lòng nhập lý do từ chối."); return; }
    const label = decision === "approved" ? "phê duyệt" : "từ chối";
    if (!window.confirm(`Xác nhận ${label} đơn đăng ký này?`)) return;
    setBusyId(application.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/vendor-applications/${encodeURIComponent(application.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rejectionReason }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Không thể cập nhật đơn đăng ký.");
      setApplications((current) => current.map((item) => item.id === application.id ? { ...item, ...body.application } : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể cập nhật đơn đăng ký."); }
    finally { setBusyId(""); }
  }

  if (loading) return <div className="grid gap-5"><div className="cs-skeleton h-40 rounded-2xl" /><div className="cs-skeleton h-80 rounded-2xl" /></div>;

  return (
    <div className="space-y-8">
      <section><p className="cs-eyebrow text-accent-strong">Vận hành thương mại</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-extrabold">Bảng điều hành</h1><p className="mt-2 text-muted">Theo dõi đơn hàng, đối tác và tình trạng nhập dữ liệu.</p></div><button className="cs-button cs-button--secondary" onClick={() => void load()}>Làm mới</button></div></section>
      {error ? <div className="cs-alert cs-alert--danger" role="alert">{error}</div> : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="cs-surface-standard rounded-2xl p-5"><p className="cs-eyebrow text-muted">Tổng đơn hàng</p><p className="mt-2 text-3xl font-extrabold">{dashboard?.orderCount ?? 0}</p></article>
        <article className="cs-surface-standard rounded-2xl p-5"><p className="cs-eyebrow text-muted">Đã thanh toán</p><p className="mt-2 text-3xl font-extrabold">{dashboard?.paidOrderCount ?? 0}</p></article>
        <article className="cs-surface-standard rounded-2xl p-5"><p className="cs-eyebrow text-muted">Doanh thu đã thu</p><p className="mt-2 text-3xl font-extrabold">{formatUsd(dashboard?.paidRevenueUsd)}</p></article>
      </section>

      <section className="cs-surface-standard rounded-2xl p-6"><h2 className="text-2xl font-bold">Đơn hàng gần đây</h2><div className="mt-4 overflow-x-auto"><table className="cs-table w-full"><thead><tr><th>Mã đơn</th><th>Trạng thái</th><th>Giá trị</th><th>Thời gian</th></tr></thead><tbody>{dashboard?.recentOrders.length ? dashboard.recentOrders.map((order) => <tr key={order.id}><td>#{order.id.slice(0, 10)}</td><td><span className="cs-badge">{order.status}</span></td><td>{formatUsd(order.subtotalUsd)}</td><td>{new Date(order.createdAt).toLocaleString("vi-VN")}</td></tr>) : <tr><td colSpan={4} className="py-8 text-center text-muted">Chưa có đơn hàng.</td></tr>}</tbody></table></div></section>

      <section id="vendors" className="cs-surface-standard scroll-mt-24 rounded-2xl p-6"><h2 className="text-2xl font-bold">Đơn đăng ký nhà bán</h2><div className="mt-5 space-y-4">{applications.length ? applications.map((application) => <article className="rounded-xl border border-border p-4" key={application.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{application.userId}</p><p className="mt-1 text-sm text-muted">{new Date(application.createdAt).toLocaleString("vi-VN")}</p></div><span className="cs-badge">{application.status}</span></div>{application.status === "pending" ? <div className="mt-4 flex flex-wrap items-center gap-3"><input aria-label="Lý do từ chối" className="cs-field__control min-w-64 flex-1" placeholder="Lý do nếu từ chối" value={reasons[application.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [application.id]: event.target.value }))} /><button disabled={busyId === application.id} className="cs-button" onClick={() => void decide(application, "approved")}>Phê duyệt</button><button disabled={busyId === application.id} className="cs-button cs-button--secondary" onClick={() => void decide(application, "rejected")}>Từ chối</button></div> : application.rejectionReason ? <p className="mt-3 text-sm text-muted">Lý do: {application.rejectionReason}</p> : null}</article>) : <p className="py-8 text-center text-muted">Không có đơn đăng ký nào.</p>}</div></section>

      <section id="payouts" className="cs-surface-standard scroll-mt-24 rounded-2xl p-6"><h2 className="text-2xl font-bold">Thanh toán đối tác</h2><p className="mt-2 text-sm text-muted">Lịch sử hiển thị để đối soát. Việc tạo khoản thanh toán vẫn tuân theo quy trình tài chính hiện có.</p><div className="mt-4 overflow-x-auto"><table className="cs-table w-full"><thead><tr><th>Nhà bán</th><th>Số tiền</th><th>Dòng đơn hàng</th><th>Thời gian</th></tr></thead><tbody>{payouts.length ? payouts.map((payout) => <tr key={payout.id}><td>{payout.vendorId}</td><td>{formatUsd(payout.amountUsd)}</td><td>{payout.orderItemIds.length}</td><td>{new Date(payout.createdAt).toLocaleString("vi-VN")}</td></tr>) : <tr><td colSpan={4} className="py-8 text-center text-muted">Chưa có khoản thanh toán.</td></tr>}</tbody></table></div></section>

      <section id="import" className="cs-surface-standard scroll-mt-24 rounded-2xl p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">Nhập dữ liệu WordPress</h2><p className="mt-2 text-sm text-muted">Chỉ hiển thị trạng thái. Cutover sản xuất vẫn đang được hoãn theo quyết định vận hành.</p></div><span className="cs-badge">{importStatus?.adapter || "unknown"} · {importStatus?.runtime || "none"}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border p-4"><p className="text-sm text-muted">MySQL client</p><strong>{importStatus?.mysqlClient ? "Sẵn sàng" : "Chưa cấu hình"}</strong></div><div className="rounded-xl border border-border p-4"><p className="text-sm text-muted">WordPress PHP runtime</p><strong>{importStatus?.wordpressPhpRuntime ? "Sẵn sàng" : "Chưa cấu hình"}</strong></div></div><div className="mt-5 space-y-2">{importStatus?.recentRuns.length ? importStatus.recentRuns.map((run) => <div className="flex flex-wrap justify-between gap-3 rounded-xl border border-border p-4" key={run.id}><span><strong>{run.mode}</strong><small className="ml-2 text-muted">{new Date(run.createdAt).toLocaleString("vi-VN")}</small></span><span className="text-sm">Nhận {run.acceptedCount} · Bỏ qua {run.skippedCount} · Chưa khớp {run.unmatchedCount} · Từ chối {run.rejectedCount}</span></div>) : <p className="py-6 text-center text-muted">Chưa có lần nhập dữ liệu.</p>}</div></section>

      <AdminAiPanel />
    </div>
  );
}
