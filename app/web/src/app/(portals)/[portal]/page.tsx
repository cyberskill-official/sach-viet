import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { DataTable } from "@/components/data-table";
import { PortalShell } from "@/components/portal-shell";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { getPortal, mayAccessPortal, normalizeLocale, translate } from "@/lib/web-foundations.mjs";

export default async function PortalPage({ params, searchParams }: { params: Promise<{ portal: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { portal } = await params; const { lang } = await searchParams; const config = getPortal(portal); if (!config) notFound();
  let user = null; if (!config.public) { const token = (await cookies()).get(COOKIE_NAME)?.value; try { user = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET)?.user || null; } catch { redirect(`/login?redirect=/${portal}`); } if (!mayAccessPortal(user, portal)) redirect("/forbidden"); }
  const locale = normalizeLocale(lang);
  if (portal === "admin") return <PortalShell portal={portal} locale={locale} user={user}><AdminDashboard /></PortalShell>;
  const policyPending = portal === "publisher" || portal === "author";
  return <PortalShell portal={portal} locale={locale} user={user}><section className="cs-surface-standard rounded-2xl p-6"><p className="cs-eyebrow text-accent-strong">{config.label}</p><h1 className="mt-3 text-3xl font-extrabold">{translate(locale, "overview")}</h1>{policyPending ? <div className="cs-alert cs-alert--warning mt-5"><strong>{locale === "vi" ? "Chính sách đang chờ quyết định" : "Policy decision pending"}</strong><p className="mt-1">{locale === "vi" ? "Thông tin tài chính, bản quyền và thu nhập chỉ được hiển thị sau khi chính sách được phê duyệt. Không có thao tác kích hoạt tại đây." : "Financial, royalty, and earnings information remains unavailable until policy approval. No activation action is offered here."}</p></div> : <DataTable labels={{ empty: translate(locale, "empty"), previous: translate(locale, "previous"), next: translate(locale, "next") }} rows={[]} />}</section></PortalShell>;
}
