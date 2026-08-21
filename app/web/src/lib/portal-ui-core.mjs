export const CART_KEY = "sv_cart_v1";

export const portalNavigation = Object.freeze({
  admin: [
    { href: "/admin", key: "overview" },
    { href: "/admin#catalog", key: "catalog" },
    { href: "/admin#vendors", key: "vendors" },
    { href: "/admin#payouts", key: "payouts" },
    { href: "/admin#flags", key: "flags" },
  ],
  vendor: [
    { href: "/vendor", key: "overview" },
    { href: "/vendor#offers", key: "offers" },
    { href: "/vendor#orders", key: "orders" },
    { href: "/vendor#payouts", key: "payouts" },
  ],
  publisher: [
    { href: "/publisher", key: "overview" },
    { href: "/publisher#requests", key: "requests" },
    { href: "/publisher#marc", key: "marc" },
    { href: "/publisher#finance", key: "finance" },
  ],
  author: [
    { href: "/author", key: "overview" },
    { href: "/author#requests", key: "requests" },
    { href: "/author#finance", key: "finance" },
  ],
  institution: [
    { href: "/institution", key: "overview" },
    { href: "/institution#quotes", key: "quotes" },
    { href: "/institution#orders", key: "orders" },
    { href: "/institution#budget", key: "budget" },
  ],
  employee: [
    { href: "/employee", key: "overview" },
    { href: "/employee#tickets", key: "tickets" },
    { href: "/employee#home", key: "home" },
  ],
  retail: [
    { href: "/retail", key: "overview" },
    { href: "/retail#orders", key: "orders" },
  ],
  b2b: [
    { href: "/b2b", key: "overview" },
    { href: "/b2b#pipeline", key: "pipeline" },
  ],
  supplier: [],
});

const portalMessages = Object.freeze({
  vi: {
    overview: "Tổng quan",
    catalog: "Danh mục",
    vendors: "Đơn đăng ký nhà bán",
    payouts: "Thanh toán đối tác",
    flags: "Cờ vận hành",
    offers: "Chào bán",
    orders: "Đơn hàng",
    requests: "Yêu cầu",
    marc: "MARC",
    quotes: "Báo giá",
    tickets: "Hỗ trợ",
    pipeline: "Pipeline",
    finance: "Tài chính (chờ DEC)",
    budget: "Ngân sách",
    home: "Trang chủ",
  },
  en: {
    overview: "Overview",
    catalog: "Catalog",
    vendors: "Vendor applications",
    payouts: "Vendor payouts",
    flags: "Ops flags",
    offers: "Offers",
    orders: "Orders",
    requests: "Requests",
    marc: "MARC",
    quotes: "Quotes",
    tickets: "Support",
    pipeline: "Pipeline",
    finance: "Finance (DEC pending)",
    budget: "Budget",
    home: "Home sections",
  },
});

export function navigationForPortal(portal, locale = "en") {
  const messages = portalMessages[locale] || portalMessages.en;
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

export function formatUsd(value, locale = "en") {
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
