"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Crown, ShoppingBag } from "@phosphor-icons/react";
import { CART_KEY, normalizeCart } from "@/lib/portal-ui-core.mjs";
import { themes } from "@/lib/web-foundations.mjs";
import { useLocale } from "@/components/locale-provider";
import { useTheme } from "@/components/theme-provider";
import { TourLauncher } from "@/components/tours/tour-provider";

type LuxuryWidth = "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl" | "7xl";

const widthClass: Record<LuxuryWidth, string> = {
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "7xl": "max-w-7xl",
};

function readCartCount(): number {
  try {
    return normalizeCart(JSON.parse(window.localStorage.getItem(CART_KEY) || "[]")).reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  } catch {
    return 0;
  }
}

export function LuxuryShell({
  children,
  width = "5xl",
  tourId,
}: {
  children: React.ReactNode;
  width?: LuxuryWidth;
  tourId?: string;
}) {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const sync = () => setCartCount(readCartCount());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <main className="sv-luxury min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 sv-glass-heavy">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sv-lux-gold-soft,#ca8a04)]"
          >
            <span
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--sv-lux-stone-900)] to-[var(--sv-lux-gold-strong)] text-white shadow-[0_10px_30px_color-mix(in_oklab,var(--sv-lux-gold)_28%,transparent)]"
              aria-hidden="true"
            >
              <Crown size={22} weight="duotone" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <strong className="sv-font-display block truncate text-xl tracking-tight">{t("common.brand")}</strong>
              <small className="hidden text-xs tracking-[0.14em] text-muted uppercase sm:block">{t("common.tagline")}</small>
            </span>
          </Link>
          <nav className="flex shrink-0 flex-wrap items-center gap-1.5 text-sm sm:gap-2" aria-label={t("common.navigation")}>
            <Link className="cs-button cs-button--ghost hidden sm:inline-flex" href="/features">{t("nav.features")}</Link>
            <Link className="cs-button cs-button--ghost hidden md:inline-flex" href="/membership">{t("storefront.membershipEyebrow")}</Link>
            <Link
              className="cs-button cs-button--secondary inline-flex min-h-11 items-center gap-2"
              href="/ecom/cart"
              aria-label={`${t("nav.cart")} (${cartCount})`}
            >
              <ShoppingBag size={18} weight="regular" aria-hidden="true" />
              <span className="hidden sm:inline">{t("nav.cart")}</span>
              <span aria-hidden="true">({cartCount})</span>
            </Link>
            {tourId ? <TourLauncher tourId={tourId} /> : null}
            <button
              type="button"
              className="cs-button cs-button--ghost min-h-11 min-w-11"
              aria-label={t("common.language")}
              onClick={() => setLocale(locale === "en" ? "vi" : "en")}
            >
              {locale === "en" ? "VI" : "EN"}
            </button>
            <label className="cs-field inline-flex min-w-[7.5rem] items-center gap-2">
              <span className="sv-sr-only">{t("common.theme")}</span>
              <select
                aria-label={t("common.theme")}
                value={theme}
                onChange={(event) => setTheme(event.target.value as typeof theme)}
                className="cs-field__control"
              >
                {themes.map((item) => (
                  <option key={item} value={item}>
                    {item === "light" ? t("common.themeLight") : t("common.themeDark")}
                  </option>
                ))}
              </select>
            </label>
            <Link className="cs-button cs-button--ghost hidden sm:inline-flex" href="/login">{t("nav.login")}</Link>
          </nav>
        </div>
      </header>
      <div className={`mx-auto px-5 py-10 sm:px-8 sm:py-12 ${widthClass[width]}`}>{children}</div>
    </main>
  );
}

export function LuxuryAuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <LuxuryShell width="2xl">
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center py-6">
        <div className="sv-glass-heavy w-full max-w-md rounded-2xl p-7 sm:p-8">{children}</div>
      </div>
    </LuxuryShell>
  );
}
