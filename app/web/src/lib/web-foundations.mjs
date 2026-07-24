import { canAccessPortal } from "./access.mjs";

export const locales = ["vi", "en"];
export const themes = ["light", "dark", "glass"];
export const portalConfig = Object.freeze({
  ecom: { label: "Storefront", accent: "emerald", public: true },
  vendor: { label: "Vendor", accent: "emerald" }, admin: { label: "Administration", accent: "blue" },
  employee: { label: "Employee", accent: "indigo" }, retail: { label: "Retail", accent: "rose" },
  b2b: { label: "B2B", accent: "cyan" }, institution: { label: "Institution", accent: "sky" },
  publisher: { label: "Publisher", accent: "purple" }, author: { label: "Author", accent: "orange" }, supplier: { label: "Supplier", accent: "amber" },
});

const messages = {
  vi: { navigation: "Dieu huong", overview: "Tong quan", empty: "Chua co du lieu", previous: "Truoc", next: "Tiep", language: "Ngon ngu", theme: "Giao dien" },
  en: { navigation: "Navigation", overview: "Overview", empty: "No data available", previous: "Previous", next: "Next", language: "Language", theme: "Theme" },
};

export function normalizeLocale(value) { return locales.includes(value) ? value : "vi"; }
export function normalizeTheme(value) { return themes.includes(value) ? value : "light"; }
export function translate(locale, key) { return messages[normalizeLocale(locale)][key] || key; }
export function getPortal(portal) { return portalConfig[portal] || null; }
export function mayAccessPortal(user, portal) { const config = getPortal(portal); return Boolean(config && (config.public || (user && canAccessPortal(user.role, portal)))); }
