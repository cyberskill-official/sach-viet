"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { NotificationCenter } from "./notification-center";
import { useTheme } from "./theme-provider";
import { themes } from "@/lib/web-foundations.mjs";
import { navigationForPortal } from "@/lib/portal-ui-core.mjs";

export function PortalShell({ portal, locale, user, children }: { portal: string; locale: string; user?: { id: string; role: string } | null; children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const links = navigationForPortal(portal, locale) as Array<{ href: string; key: string; label: string }>;
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border bg-panel/85 px-5 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href={`/${portal}`} className="flex items-center gap-3 font-bold"><span className="grid size-9 place-items-center rounded-full bg-accent-strong text-sm text-white">SV</span><span>Sách Việt <span className="font-normal text-muted">/ {portal}</span></span></Link>
        <nav className="flex items-center gap-2 text-sm">
          {user ? <NotificationCenter locale={locale} /> : null}
          <Link className="cs-button cs-button--ghost" href={`/${portal}?lang=${locale === "vi" ? "en" : "vi"}`}>{locale === "vi" ? "EN" : "VI"}</Link>
          <select aria-label={locale === "vi" ? "Giao diện" : "Theme"} value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)} className="cs-field__control">
            {themes.map((item) => <option key={item} value={item}>{item === "light" ? (locale === "vi" ? "Sáng" : "Light") : (locale === "vi" ? "Tối" : "Dark")}</option>)}
          </select>
          {user ? <button className="cs-button cs-button--ghost" onClick={logout}>{locale === "vi" ? "Đăng xuất" : "Sign out"}</button> : null}
        </nav>
      </div>
    </header>
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-[15rem_1fr]">
      <aside className="cs-surface-standard h-fit rounded-2xl p-4 text-sm">
        <p className="cs-eyebrow px-3 text-muted">{locale === "vi" ? "Điều hướng" : "Navigation"}</p>
        <nav className="mt-3 space-y-1">{links.map((item) => <Link key={item.href} className={`block rounded-xl px-3 py-3 font-medium ${pathname === item.href.split("#")[0] ? "bg-accent-tint text-accent-strong" : "text-muted hover:bg-accent-tint hover:text-foreground"}`} href={item.href}>{item.label}</Link>)}</nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </section>
  </main>;
}
