/**
 * Compatibility facade: locales/themes/portals + translate from i18n catalogs.
 * Default locale is English (TASK-UI-005).
 */
import { canAccessPortal } from "./access.mjs";
import {
  DEFAULT_LOCALE,
  locales as i18nLocales,
  normalizeLocale as normalizeI18nLocale,
  translate as i18nTranslate,
} from "./i18n/index.mjs";

export const locales = i18nLocales;
export const themes = ["light", "dark"];
export const portalConfig = Object.freeze({
  ecom: { label: "Storefront", accent: "emerald", public: true },
  vendor: { label: "Vendor", accent: "emerald" }, admin: { label: "Administration", accent: "blue" },
  employee: { label: "Employee", accent: "indigo" }, retail: { label: "Retail", accent: "rose" },
  b2b: { label: "B2B", accent: "cyan" }, institution: { label: "Institution", accent: "sky" },
  publisher: { label: "Publisher", accent: "purple" }, author: { label: "Author", accent: "orange" }, supplier: { label: "Supplier", accent: "amber" },
});

export function normalizeLocale(value) {
  return normalizeI18nLocale(value);
}

export function normalizeTheme(value) {
  return themes.includes(value) ? value : "light";
}

export function translate(locale, key, vars) {
  return i18nTranslate(locale, key, vars);
}

export function getPortal(portal) {
  return portalConfig[portal] || null;
}

export function mayAccessPortal(user, portal) {
  const config = getPortal(portal);
  return Boolean(config && (config.public || (user && canAccessPortal(user.role, portal))));
}

export { DEFAULT_LOCALE };
