"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationCenter } from "./notification-center";
import { useTheme } from "./theme-provider";
import { useLocale } from "./locale-provider";
import { TourLauncher } from "./tours/tour-provider";
import { themes } from "@/lib/web-foundations.mjs";
import { navigationForPortal } from "@/lib/portal-ui-core.mjs";
import { tourIdForPortal } from "@/lib/tours/registry.mjs";

export function PortalShell({ portal, locale: localeProp, user, children }: { portal: string; locale?: string; user?: { id: string; role: string } | null; children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { locale: ctxLocale, setLocale, t } = useLocale();
  const locale = localeProp === "en" || localeProp === "vi" ? localeProp : ctxLocale;
  const pathname = usePathname();
  const links = navigationForPortal(portal, locale) as Array<{ href: string; key: string; label: string }>;
  const tourId = tourIdForPortal(portal);
  const [navOpen, setNavOpen] = useState(false);

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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-panel/85 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link href={`/${portal}`} className="flex min-w-0 items-center gap-3 rounded-xl font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cs-color-accent-ochre,#f4ba17)]">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-strong text-sm text-white" aria-hidden="true">SV</span>
              <span className="truncate">{t("common.brand")} <span className="font-normal text-muted">/ {portal}</span></span>
            </Link>
            <button
              type="button"
              className="cs-button cs-button--ghost md:hidden"
              aria-expanded={navOpen}
              aria-controls="portal-side-nav"
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? t("common.hideNavigation") : t("common.showNavigation")}
            </button>
          </div>
          <nav className="flex max-w-full flex-wrap items-center gap-2 text-sm">
            <Link className="cs-button cs-button--ghost" href="/features">{t("nav.features")}</Link>
            {user ? <NotificationCenter locale={locale} /> : null}
            <TourLauncher tourId={tourId} />
            <Link
              className="cs-button cs-button--ghost"
              data-tour="portal-lang"
              aria-label={t("common.language")}
              href={`/${portal}?lang=${locale === "vi" ? "en" : "vi"}`}
            >
              {locale === "vi" ? "EN" : "VI"}
            </Link>
            <label className="cs-field inline-flex min-w-[7.5rem] items-center gap-2">
              <span className="sv-sr-only">{t("common.theme")}</span>
              <select aria-label={t("common.theme")} value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)} className="cs-field__control">
                {themes.map((item) => <option key={item} value={item}>{item === "light" ? t("common.themeLight") : t("common.themeDark")}</option>)}
              </select>
            </label>
            {user ? <button type="button" className="cs-button cs-button--ghost" onClick={logout}>{t("common.signOut")}</button> : null}
          </nav>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-[15rem_1fr]">
        <aside
          id="portal-side-nav"
          className={`cs-surface-standard h-fit rounded-2xl p-4 text-sm ${navOpen ? "block" : "hidden"} md:block`}
          data-tour="portal-nav"
        >
          <p className="cs-eyebrow px-3 text-muted">{t("common.navigation")}</p>
          <nav className="mt-3 space-y-1" aria-label={t("common.navigation")}>
            {links.map((item) => {
              const active = pathname === item.href.split("#")[0];
              return (
                <Link
                  key={item.href}
                  className={`sv-nav-link ${active ? "is-active" : ""}`}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setNavOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </section>
    </main>
  );
}
