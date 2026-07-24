import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { PortalShell } from "@/components/portal-shell";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { getPortal, mayAccessPortal, normalizeLocale, translate } from "@/lib/web-foundations.mjs";

export default async function PortalPage({ params, searchParams }: { params: Promise<{ portal: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { portal } = await params; const { lang } = await searchParams; const config = getPortal(portal); if (!config) notFound();
  let user = null; if (!config.public) { const token = (await cookies()).get(COOKIE_NAME)?.value; try { user = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET)?.user || null; } catch { redirect(`/login?redirect=/${portal}`); } if (!mayAccessPortal(user, portal)) redirect("/forbidden"); }
  const locale = normalizeLocale(lang);
  return <PortalShell portal={portal} locale={locale}><p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{config.accent}</p><h1 className="mt-3 text-3xl font-semibold">{config.label}</h1><p className="mt-2 text-muted">{translate(locale, "overview")}</p><DataTable labels={{ empty: translate(locale, "empty"), previous: translate(locale, "previous"), next: translate(locale, "next") }} rows={[]} /></PortalShell>;
}
