"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Crown, List, ShoppingBag, X } from "@phosphor-icons/react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sync = () => setCartCount(readCartCount());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              className="cs-button cs-button--secondary inline-flex min-h-11 min-w-11 items-center justify-center gap-2"
              href="/ecom/cart"
              aria-label={`${t("nav.cart")} (${cartCount})`}
            >
              <ShoppingBag size={18} weight="regular" aria-hidden="true" />
              <span className="hidden sm:inline">{t("nav.cart")}</span>
              <span className="hidden sm:inline" aria-hidden="true">({cartCount})</span>
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="cs-button cs-button--ghost inline-flex min-h-11 min-w-11 items-center justify-center"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-controls={menuId}
                aria-label={menuOpen ? t("common.hideNavigation") : t("common.showNavigation")}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X size={22} weight="bold" aria-hidden="true" /> : <List size={22} weight="bold" aria-hidden="true" />}
              </button>
              {menuOpen ? (
                <div
                  id={menuId}
                  role="menu"
                  className="sv-glass-heavy absolute right-0 top-12 z-50 max-h-[min(70vh,28rem)] w-[min(18rem,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl p-2 shadow-xl"
                >
                  <nav className="flex flex-col gap-1 text-sm" aria-label={t("common.navigation")}>
                    <Link className="cs-button cs-button--ghost flex min-h-11 w-full justify-start" href="/features" role="menuitem" onClick={() => setMenuOpen(false)}>
                      {t("nav.features")}
                    </Link>
                    <Link className="cs-button cs-button--ghost flex min-h-11 w-full justify-start" href="/membership" role="menuitem" onClick={() => setMenuOpen(false)}>
                      {t("storefront.membershipEyebrow")}
                    </Link>
                    {tourId ? (
                      <div className="px-1 py-1" role="none">
                        <TourLauncher tourId={tourId} className="cs-button cs-button--ghost flex min-h-11 w-full justify-start" />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      className="cs-button cs-button--ghost flex min-h-11 w-full justify-start"
                      aria-label={t("common.language")}
                      onClick={() => {
                        setLocale(locale === "en" ? "vi" : "en");
                        setMenuOpen(false);
                      }}
                    >
                      {locale === "en" ? "VI" : "EN"}
                    </button>
                    <label className="cs-field mx-1 my-1 block">
                      <span className="sv-sr-only">{t("common.theme")}</span>
                      <select
                        aria-label={t("common.theme")}
                        value={theme}
                        onChange={(event) => setTheme(event.target.value as typeof theme)}
                        className="cs-field__control min-h-11 w-full"
                      >
                        {themes.map((item) => (
                          <option key={item} value={item}>
                            {item === "light" ? t("common.themeLight") : t("common.themeDark")}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Link className="cs-button cs-button--ghost flex min-h-11 w-full justify-start" href="/login" role="menuitem" onClick={() => setMenuOpen(false)}>
                      {t("nav.login")}
                    </Link>
                  </nav>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
      <div className={`mx-auto px-5 py-10 sm:px-8 sm:py-12 ${widthClass[width]}`}>{children}</div>
    </main>
  );
}

/** Minimal chrome for auth surfaces — brand + language only (no duplicate in-card nav). */
export function LuxuryAuthFrame({ children }: { children: React.ReactNode }) {
  const { locale, setLocale, t } = useLocale();
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
            <strong className="sv-font-display truncate text-xl tracking-tight">{t("common.brand")}</strong>
          </Link>
          <button
            type="button"
            className="cs-button cs-button--ghost min-h-11 min-w-11"
            data-tour="auth-lang"
            aria-label={t("common.language")}
            onClick={() => setLocale(locale === "en" ? "vi" : "en")}
          >
            {locale === "en" ? "VI" : "EN"}
          </button>
        </div>
      </header>
      <div className="mx-auto flex min-h-[calc(100vh-5.5rem)] max-w-2xl items-center justify-center px-5 py-10 sm:px-8">
        <div className="sv-glass-heavy w-full max-w-md rounded-2xl p-7 sm:p-8">{children}</div>
      </div>
    </main>
  );
}
