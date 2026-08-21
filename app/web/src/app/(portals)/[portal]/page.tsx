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
      ? translate(locale, "portals.vendorSettlementBanner")
      : portal === "b2b" || portal === "institution"
        ? translate(locale, "portals.b2bPolicy")
        : translate(locale, "portals.royaltyBanner");

  return (
    <PortalShell portal={portal} locale={locale} user={user}>
      <section className="cs-surface-standard rounded-2xl p-6">
        <p className="cs-eyebrow text-accent-strong">{config.label}</p>
        <h1 className="mt-3 text-3xl font-extrabold">{translate(locale, "overview")}</h1>
        {financeDeferred ? (
          <div className="cs-alert cs-alert--warning mt-5">
            <strong>{translate(locale, "portals.policyPending")}</strong>
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
