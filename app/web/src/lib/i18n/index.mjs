import { messagesEn } from "./messages-en.mjs";
import { messagesVi } from "./messages-vi.mjs";

export const locales = Object.freeze(["en", "vi"]);
export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "sv_locale";
export const LOCALE_STORAGE_KEY = "sv_locale";

const catalogs = Object.freeze({
  en: messagesEn,
  vi: messagesVi,
});

function flattenKeys(obj, prefix = "", out = []) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenKeys(value, path, out);
    } else {
      out.push(path);
    }
  }
  return out;
}

export function catalogKeys(locale = DEFAULT_LOCALE) {
  return flattenKeys(catalogs[normalizeLocale(locale)] || catalogs.en);
}

export function assertCatalogParity() {
  const enKeys = new Set(catalogKeys("en"));
  const viKeys = new Set(catalogKeys("vi"));
  const missingInVi = [...enKeys].filter((key) => !viKeys.has(key));
  const missingInEn = [...viKeys].filter((key) => !enKeys.has(key));
  return { missingInVi, missingInEn, ok: missingInVi.length === 0 && missingInEn.length === 0 };
}

export function normalizeLocale(value) {
  return locales.includes(value) ? value : DEFAULT_LOCALE;
}

function lookup(catalog, key) {
  if (typeof key !== "string" || !key) return null;
  const parts = key.split(".");
  let node = catalog;
  for (const part of parts) {
    if (!node || typeof node !== "object" || !(part in node)) return null;
    node = node[part];
  }
  return typeof node === "string" ? node : null;
}

/** Dot-path keys (nav.cart) or legacy flat keys (empty, navigation) from web-foundations. */
export function translate(locale, key, vars = {}) {
  const normalized = normalizeLocale(locale);
  const catalog = catalogs[normalized];
  let text = lookup(catalog, key);
  if (text == null && !key.includes(".")) {
    text = lookup(catalog, `common.${key}`)
      || lookup(catalog, `portals.${key}`)
      || lookup(catalog, `nav.${key}`);
  }
  if (text == null) text = key;
  return String(text).replace(/\{(\w+)\}/g, (_, name) => (
    vars[name] != null ? String(vars[name]) : `{${name}}`
  ));
}

/**
 * Resolution: explicit ?lang= → cookie/storage → userLocale → en
 */
export function resolveLocale({ queryLang, cookieLocale, storageLocale, userLocale } = {}) {
  if (queryLang === "en" || queryLang === "vi") return queryLang;
  if (cookieLocale === "en" || cookieLocale === "vi") return cookieLocale;
  if (storageLocale === "en" || storageLocale === "vi") return storageLocale;
  if (userLocale === "en" || userLocale === "vi") return userLocale;
  return DEFAULT_LOCALE;
}

export function readLocaleCookie(cookieHeader) {
  if (typeof cookieHeader !== "string") return null;
  const match = cookieHeader.match(/(?:^|;\s*)sv_locale=(en|vi)(?:;|$)/);
  return match ? match[1] : null;
}

export function localeCookieHeader(locale, { maxAge = 60 * 60 * 24 * 365 } = {}) {
  const value = normalizeLocale(locale);
  return `${LOCALE_COOKIE}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
}

export function mapValidationMessage(locale, codeOrMessage) {
  const map = {
    required: "validation.required",
    invalid_email: "validation.invalidEmail",
    invalid_request: "validation.invalidRequest",
    unauthenticated: "validation.unauthenticated",
    not_found: "validation.notFound",
    forbidden: "validation.forbidden",
  };
  const key = map[codeOrMessage];
  if (key) return translate(locale, key);
  if (typeof codeOrMessage === "string" && codeOrMessage) return codeOrMessage;
  return translate(locale, "validation.serverError");
}
