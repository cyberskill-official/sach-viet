"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminAiPanel } from "@/components/admin-ai-panel";
import { formatUsd } from "@/lib/portal-ui-core.mjs";

type Dashboard = { orderCount: number; paidOrderCount: number; paidRevenueUsd: string; recentOrders: Array<{ id: string; status: string; subtotalUsd: string; createdAt: number }> };
type Application = { id: string; userId: string; status: string; rejectionReason?: string | null; createdAt: number };
type Payout = { id: string; vendorId: string; amountUsd: string; orderItemIds: string[]; createdAt: number };
type ImportStatus = { adapter: string; runtime: string; mysqlClient: boolean; wordpressPhpRuntime: boolean; recentRuns: Array<{ id: string; mode: string; acceptedCount: number; skippedCount: number; unmatchedCount: number; rejectedCount: number; createdAt: number }> };
type Category = { id: string; slug: string; name: string };
type CatalogProduct = { id: string; slug: string; title: string; category?: { slug: string; name: string }; variants?: Array<{ id: string; sku: string; title: string }>; primaryOffer?: { id: string; priceUsd: string; stockQuantity: number } | null };

async function readJson(url: string) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

async function postJson(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categoryForm, setCategoryForm] = useState({ slug: "", name: "" });
  const [productForm, setProductForm] = useState({ categorySlug: "", slug: "", title: "", description: "", variantSku: "", variantTitle: "" });
  const [offerForm, setOfferForm] = useState({ productId: "", variantId: "", vendorId: "", priceUsd: "", stockQuantity: "1" });
  const [catalogBusy, setCatalogBusy] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardBody, applicationsBody, payoutsBody, importBody, categoriesBody, productsBody] = await Promise.all([
        readJson("/api/admin/commerce/dashboard"),
        readJson("/api/admin/vendor-applications"),
        readJson("/api/admin/payouts"),
        readJson("/api/admin/wordpress-import/status"),
        readJson("/api/admin/catalog/categories"),
        readJson("/api/admin/catalog/products"),
      ]);
      setDashboard(dashboardBody.dashboard);
      setApplications(applicationsBody.applications || []);
      setPayouts(payoutsBody.payouts || []);
      setImportStatus(importBody.status);
      setCategories(categoriesBody.categories || []);
      setProducts(productsBody.products || []);
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

  async function createCategory() {
    setCatalogBusy("category");
    setError("");
    try {
      await postJson("/api/admin/catalog/categories", { slug: categoryForm.slug, name: categoryForm.name });
      setCategoryForm({ slug: "", name: "" });
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tạo danh mục."); }
    finally { setCatalogBusy(""); }
  }

  async function createProduct() {
    setCatalogBusy("product");
    setError("");
    try {
      const payload: Record<string, unknown> = {
        categorySlug: productForm.categorySlug,
        slug: productForm.slug,
        title: productForm.title,
        description: productForm.description || undefined,
      };
      if (productForm.variantSku.trim() && productForm.variantTitle.trim()) {
        payload.variant = { sku: productForm.variantSku, title: productForm.variantTitle };
      }
      const body = await postJson("/api/admin/catalog/products", payload);
      setProductForm({ categorySlug: productForm.categorySlug, slug: "", title: "", description: "", variantSku: "", variantTitle: "" });
      if (body.product?.id) setOfferForm((current) => ({ ...current, productId: body.product.id, variantId: body.variants?.[0]?.id || "" }));
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tạo sản phẩm."); }
    finally { setCatalogBusy(""); }
  }

  async function createOffer() {
    setCatalogBusy("offer");
    setError("");
    try {
      const stockQuantity = Number(offerForm.stockQuantity);
      await postJson("/api/admin/catalog/offers", {
        productId: offerForm.productId,
        variantId: offerForm.variantId || undefined,
        vendorId: offerForm.vendorId || undefined,
        priceUsd: offerForm.priceUsd,
        stockQuantity,
        isActive: true,
      });
      setOfferForm((current) => ({ ...current, priceUsd: "", stockQuantity: "1" }));
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tạo chào bán."); }
    finally { setCatalogBusy(""); }
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

      <section id="catalog" className="cs-surface-standard scroll-mt-24 rounded-2xl p-6">
        <h2 className="text-2xl font-bold">Danh mục sản phẩm</h2>
        <p className="mt-2 text-sm text-muted">Tạo danh mục, sản phẩm và chào bán cho Day-2. Để trống mã nhà bán để dùng tài khoản admin hiện tại.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-border p-4"><p className="text-sm text-muted">Danh mục</p><strong className="text-2xl">{categories.length}</strong></article>
          <article className="rounded-xl border border-border p-4"><p className="text-sm text-muted">Sản phẩm</p><strong className="text-2xl">{products.length}</strong></article>
          <article className="rounded-xl border border-border p-4"><p className="text-sm text-muted">Có chào bán</p><strong className="text-2xl">{products.filter((product) => product.primaryOffer).length}</strong></article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void createCategory(); }}>
            <h3 className="font-semibold">Tạo danh mục</h3>
            <input aria-label="Slug danh mục" className="cs-field__control w-full" placeholder="slug" value={categoryForm.slug} onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value }))} />
            <input aria-label="Tên danh mục" className="cs-field__control w-full" placeholder="Tên" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} />
            <button disabled={catalogBusy === "category"} className="cs-button" type="submit">Tạo danh mục</button>
          </form>

          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void createProduct(); }}>
            <h3 className="font-semibold">Tạo sản phẩm</h3>
            <select aria-label="Danh mục sản phẩm" className="cs-field__control w-full" value={productForm.categorySlug} onChange={(event) => setProductForm((current) => ({ ...current, categorySlug: event.target.value }))}>
              <option value="">Chọn danh mục</option>
              {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
            </select>
            <input aria-label="Slug sản phẩm" className="cs-field__control w-full" placeholder="slug" value={productForm.slug} onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value }))} />
            <input aria-label="Tiêu đề sản phẩm" className="cs-field__control w-full" placeholder="Tiêu đề" value={productForm.title} onChange={(event) => setProductForm((current) => ({ ...current, title: event.target.value }))} />
            <input aria-label="Mô tả sản phẩm" className="cs-field__control w-full" placeholder="Mô tả (tuỳ chọn)" value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} />
            <input aria-label="SKU biến thể" className="cs-field__control w-full" placeholder="SKU biến thể (tuỳ chọn)" value={productForm.variantSku} onChange={(event) => setProductForm((current) => ({ ...current, variantSku: event.target.value }))} />
            <input aria-label="Tên biến thể" className="cs-field__control w-full" placeholder="Tên biến thể (tuỳ chọn)" value={productForm.variantTitle} onChange={(event) => setProductForm((current) => ({ ...current, variantTitle: event.target.value }))} />
            <button disabled={catalogBusy === "product"} className="cs-button" type="submit">Tạo sản phẩm</button>
          </form>

          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void createOffer(); }}>
            <h3 className="font-semibold">Tạo chào bán</h3>
            <select aria-label="Sản phẩm chào bán" className="cs-field__control w-full" value={offerForm.productId} onChange={(event) => {
              const productId = event.target.value;
              const product = products.find((item) => item.id === productId);
              setOfferForm((current) => ({ ...current, productId, variantId: product?.variants?.[0]?.id || "" }));
            }}>
              <option value="">Chọn sản phẩm</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}
            </select>
            <input aria-label="Mã biến thể chào bán" className="cs-field__control w-full" placeholder="Variant ID (tuỳ chọn)" value={offerForm.variantId} onChange={(event) => setOfferForm((current) => ({ ...current, variantId: event.target.value }))} />
            <input aria-label="Mã nhà bán" className="cs-field__control w-full" placeholder="Vendor ID (tuỳ chọn = admin)" value={offerForm.vendorId} onChange={(event) => setOfferForm((current) => ({ ...current, vendorId: event.target.value }))} />
            <input aria-label="Giá USD" className="cs-field__control w-full" placeholder="Giá USD" value={offerForm.priceUsd} onChange={(event) => setOfferForm((current) => ({ ...current, priceUsd: event.target.value }))} />
            <input aria-label="Tồn kho" className="cs-field__control w-full" placeholder="Tồn kho" value={offerForm.stockQuantity} onChange={(event) => setOfferForm((current) => ({ ...current, stockQuantity: event.target.value }))} />
            <button disabled={catalogBusy === "offer"} className="cs-button" type="submit">Tạo chào bán</button>
          </form>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="cs-table w-full">
            <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn</th></tr></thead>
            <tbody>
              {products.length ? products.map((product) => (
                <tr key={product.id}>
                  <td>{product.title}<div className="text-sm text-muted">{product.slug}</div></td>
                  <td>{product.category?.name || "—"}</td>
                  <td>{product.primaryOffer ? formatUsd(product.primaryOffer.priceUsd) : "—"}</td>
                  <td>{product.primaryOffer?.stockQuantity ?? "—"}</td>
                </tr>
              )) : <tr><td colSpan={4} className="py-8 text-center text-muted">Chưa có sản phẩm.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section id="import" className="cs-surface-standard scroll-mt-24 rounded-2xl p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">Nhập dữ liệu WordPress</h2><p className="mt-2 text-sm text-muted">Chỉ hiển thị trạng thái. Cutover sản xuất vẫn đang được hoãn theo quyết định vận hành.</p></div><span className="cs-badge">{importStatus?.adapter || "unknown"} · {importStatus?.runtime || "none"}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border p-4"><p className="text-sm text-muted">MySQL client</p><strong>{importStatus?.mysqlClient ? "Sẵn sàng" : "Chưa cấu hình"}</strong></div><div className="rounded-xl border border-border p-4"><p className="text-sm text-muted">WordPress PHP runtime</p><strong>{importStatus?.wordpressPhpRuntime ? "Sẵn sàng" : "Chưa cấu hình"}</strong></div></div><div className="mt-5 space-y-2">{importStatus?.recentRuns.length ? importStatus.recentRuns.map((run) => <div className="flex flex-wrap justify-between gap-3 rounded-xl border border-border p-4" key={run.id}><span><strong>{run.mode}</strong><small className="ml-2 text-muted">{new Date(run.createdAt).toLocaleString("vi-VN")}</small></span><span className="text-sm">Nhận {run.acceptedCount} · Bỏ qua {run.skippedCount} · Chưa khớp {run.unmatchedCount} · Từ chối {run.rejectedCount}</span></div>) : <p className="py-6 text-center text-muted">Chưa có lần nhập dữ liệu.</p>}</div></section>

      <AdminAiPanel />
    </div>
  );
}
