"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  locales,
  normalizeLocale,
  resolveLocale,
  translate,
} from "@/lib/i18n/index.mjs";

type Locale = "en" | "vi";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale, options?: { persistUser?: boolean }) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locales: readonly string[];
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE as Locale,
  setLocale: () => {},
  t: (key) => key,
  locales,
});

function readStorageLocale(): string | null {
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function readCookieLocale(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)sv_locale=(en|vi)(?:;|$)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function writePersistedLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch { /* ignore */ }
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`;
  } catch { /* ignore */ }
}

function queryLangFromLocation(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("lang");
  } catch {
    return null;
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return DEFAULT_LOCALE as Locale;
    return resolveLocale({
      queryLang: queryLangFromLocation(),
      cookieLocale: readCookieLocale(),
      storageLocale: readStorageLocale(),
    }) as Locale;
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    writePersistedLocale(locale);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const body = await response.json();
        const next = body?.user?.locale;
        if (!cancelled && (next === "en" || next === "vi")) {
          const resolved = resolveLocale({
            queryLang: queryLangFromLocation(),
            cookieLocale: readCookieLocale(),
            storageLocale: readStorageLocale(),
            userLocale: next,
          }) as Locale;
          setLocaleState(resolved);
          if (!queryLangFromLocation() && !readCookieLocale() && !readStorageLocale()) {
            writePersistedLocale(next);
          }
        }
      } catch { /* anonymous */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const setLocale = useCallback((next: Locale, options?: { persistUser?: boolean }) => {
    const normalized = normalizeLocale(next) as Locale;
    setLocaleState(normalized);
    writePersistedLocale(normalized);
    if (options?.persistUser) {
      void fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: normalized }),
      }).catch(() => {});
    }
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t, locales }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
