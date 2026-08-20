import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { PortalShell } from "@/components/portal-shell";
import { RolePortalPanel } from "@/components/role-portal-panel";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { getPortal, mayAccessPortal, normalizeLocale, translate } from "@/lib/web-foundations.mjs";

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ portal: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { portal } = await params;
  const { lang } = await searchParams;
  const config = getPortal(portal);
  if (!config) notFound();

  let user = null;
  if (!config.public) {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    try {
      const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
      user = session?.user || null;
    } catch {
      redirect(`/login?redirect=/${portal}`);
    }
    if (!user) redirect(`/login?redirect=/${portal}`);
    if (!mayAccessPortal(user, portal)) redirect("/forbidden");
  }

  const locale = normalizeLocale(lang);
  if (portal === "admin") {
    return (
      <PortalShell portal={portal} locale={locale} user={user}>
        <AdminDashboard />
      </PortalShell>
    );
  }

  const financeDeferred = portal === "publisher" || portal === "author" || portal === "vendor" || portal === "b2b" || portal === "institution";
  const financeCopy =
    portal === "vendor"
      ? locale === "vi"
        ? "Đối soát nhà bán / hoa hồng (DEC-SET) đang deferred — cổng chỉ hiển thị đơn, chào bán và sổ chi trả vận hành."
        : "Vendor settlement/commission (DEC-SET) is deferred — this portal shows offers, orders, and operational payout ledger only."
      : portal === "b2b" || portal === "institution"
        ? locale === "vi"
          ? "Điều khoản Net-N / chiết khấu B2B (DEC-B2B) đang deferred — pipeline và PO vẫn là vận hành."
          : "B2B Net-N / discount terms (DEC-B2B) are deferred — pipeline and PO flows remain operational only."
        : locale === "vi"
          ? "Royalty / thu nhập (DEC-ROY) đang deferred — không có tỷ lệ hoặc số liệu tính toán tại đây."
          : "Royalty / earnings (DEC-ROY) are deferred — no rates or computed financial amounts here.";

  return (
    <PortalShell portal={portal} locale={locale} user={user}>
      <section className="cs-surface-standard rounded-2xl p-6">
        <p className="cs-eyebrow text-accent-strong">{config.label}</p>
        <h1 className="mt-3 text-3xl font-extrabold">{translate(locale, "overview")}</h1>
        {financeDeferred ? (
          <div className="cs-alert cs-alert--warning mt-5">
            <strong>{locale === "vi" ? "Chính sách đang chờ quyết định" : "Policy decision pending"}</strong>
            <p className="mt-1">{financeCopy}</p>
          </div>
        ) : null}
        <RolePortalPanel
          portal={portal}
          locale={locale}
          emptyLabel={translate(locale, "empty")}
          previousLabel={translate(locale, "previous")}
          nextLabel={translate(locale, "next")}
        />
      </section>
    </PortalShell>
  );
}
