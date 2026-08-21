"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { NotificationCenter } from "./notification-center";
import { useTheme } from "./theme-provider";
import { useLocale } from "./locale-provider";
import { TourLauncher } from "./tours/tour-provider";
import { themes } from "@/lib/web-foundations.mjs";
import { navigationForPortal } from "@/lib/portal-ui-core.mjs";

export function PortalShell({ portal, locale: localeProp, user, children }: { portal: string; locale?: string; user?: { id: string; role: string } | null; children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { locale: ctxLocale, setLocale, t } = useLocale();
  const locale = localeProp === "en" || localeProp === "vi" ? localeProp : ctxLocale;
  const pathname = usePathname();
  const links = navigationForPortal(portal, locale) as Array<{ href: string; key: string; label: string }>;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (localeProp !== "en" && localeProp !== "vi") return;
    const timer = window.setTimeout(() => setLocale(localeProp), 0);
    return () => window.clearTimeout(timer);
  }, [localeProp, setLocale]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border bg-panel/85 px-5 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/${portal}`} className="flex min-w-0 items-center gap-3 font-bold"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-strong text-sm text-white">SV</span><span className="truncate">{t("common.brand")} <span className="font-normal text-muted">/ {portal}</span></span></Link>
        <nav className="flex max-w-full flex-wrap items-center gap-2 text-sm">
          <Link className="cs-button cs-button--ghost" href="/features">{t("nav.features")}</Link>
          {user ? <NotificationCenter locale={locale} /> : null}
          <TourLauncher tourId="tour.portal_overview" />
          <Link
            className="cs-button cs-button--ghost"
            data-tour="portal-lang"
            aria-label={t("common.language")}
            href={`/${portal}?lang=${locale === "vi" ? "en" : "vi"}`}
          >
            {locale === "vi" ? "EN" : "VI"}
          </Link>
          <select aria-label={t("common.theme")} value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)} className="cs-field__control">
            {themes.map((item) => <option key={item} value={item}>{item === "light" ? t("common.themeLight") : t("common.themeDark")}</option>)}
          </select>
          {user ? <button className="cs-button cs-button--ghost" onClick={logout}>{t("common.signOut")}</button> : null}
        </nav>
      </div>
    </header>
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-[15rem_1fr]">
      <aside className="cs-surface-standard h-fit rounded-2xl p-4 text-sm" data-tour="portal-nav">
        <p className="cs-eyebrow px-3 text-muted">{t("common.navigation")}</p>
        <nav className="mt-3 space-y-1">{links.map((item) => <Link key={item.href} className={`block rounded-xl px-3 py-3 font-medium ${pathname === item.href.split("#")[0] ? "bg-accent-tint text-accent-strong" : "text-muted hover:bg-accent-tint hover:text-foreground"}`} href={item.href}>{item.label}</Link>)}</nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </section>
  </main>;
}
