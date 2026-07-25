export const CART_KEY = "sv_cart_v1";

export const portalNavigation = Object.freeze({
  admin: [
    { href: "/admin", key: "overview" },
    { href: "/admin#vendors", key: "vendors" },
    { href: "/admin#payouts", key: "payouts" },
    { href: "/admin#import", key: "wordpress" },
  ],
  vendor: [{ href: "/vendor", key: "overview" }],
  publisher: [{ href: "/publisher", key: "overview" }],
  author: [{ href: "/author", key: "overview" }],
  institution: [{ href: "/institution", key: "overview" }],
  employee: [{ href: "/employee", key: "overview" }],
  retail: [{ href: "/retail", key: "overview" }],
  b2b: [{ href: "/b2b", key: "overview" }],
  supplier: [{ href: "/supplier", key: "overview" }],
});

const portalMessages = Object.freeze({
  vi: {
    overview: "Tổng quan",
    vendors: "Đơn đăng ký nhà bán",
    payouts: "Thanh toán đối tác",
    wordpress: "Nhập dữ liệu WordPress",
  },
  en: {
    overview: "Overview",
    vendors: "Vendor applications",
    payouts: "Vendor payouts",
    wordpress: "WordPress import",
  },
});

export function navigationForPortal(portal, locale = "vi") {
  const messages = portalMessages[locale] || portalMessages.vi;
  return (portalNavigation[portal] || []).map((item) => ({ ...item, label: messages[item.key] || item.key }));
}

export function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((item) => {
    const id = typeof item?.vendorOfferId === "string" ? item.vendorOfferId.trim() : "";
    const title = typeof item?.title === "string" ? item.title.trim() : "";
    const quantity = Number(item?.quantity);
    if (!id || !title || seen.has(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return [];
    seen.add(id);
    return [{
      vendorOfferId: id,
      title,
      priceUsd: typeof item.priceUsd === "string" && /^\d+(?:\.\d{1,4})?$/.test(item.priceUsd) ? item.priceUsd : null,
      quantity,
      plasticCover: item.plasticCover === true,
      giftWrap: item.giftWrap === true,
    }];
  });
}

export function addCartItem(items, item) {
  const normalized = normalizeCart([item])[0];
  if (!normalized) return normalizeCart(items);
  const existing = normalizeCart(items);
  const match = existing.find((entry) => entry.vendorOfferId === normalized.vendorOfferId);
  if (!match) return [...existing, normalized];
  return existing.map((entry) => entry.vendorOfferId === normalized.vendorOfferId
    ? { ...entry, quantity: Math.min(99, entry.quantity + normalized.quantity) }
    : entry);
}

export function updateCartQuantity(items, vendorOfferId, quantity) {
  const amount = Number(quantity);
  if (!Number.isInteger(amount) || amount < 1 || amount > 99) return normalizeCart(items);
  return normalizeCart(items).map((item) => item.vendorOfferId === vendorOfferId ? { ...item, quantity: amount } : item);
}

export function formatUsd(value, locale = "vi") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function mergeNotifications(current, incoming) {
  const byId = new Map();
  for (const item of [...incoming, ...current]) {
    if (item && typeof item.id === "string" && !byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()].sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0) || right.id.localeCompare(left.id));
}
