/**
 * Feature catalog aligned to interim DEC posture (2026-08-21b).
 * Do not invent rates; availability must match Accepted DEC text.
 */

export const FEATURE_AVAILABILITY = Object.freeze(["available", "restricted", "upcoming"]);

export const featureCatalog = Object.freeze([
  {
    id: "storefront-browse",
    category: "commerce",
    availability: "available",
    titleKey: "features.item.storefrontBrowse.title",
    descriptionKey: "features.item.storefrontBrowse.description",
    href: "/",
    tourId: "tour.storefront",
  },
  {
    id: "sandbox-checkout",
    category: "commerce",
    availability: "available",
    titleKey: "features.item.sandboxCheckout.title",
    descriptionKey: "features.item.sandboxCheckout.description",
    href: "/ecom/cart",
    tourId: "tour.product_cart",
  },
  {
    id: "live-pv3",
    category: "commerce",
    availability: "upcoming",
    titleKey: "features.item.livePv3.title",
    descriptionKey: "features.item.livePv3.description",
    href: "/features",
    tourId: null,
  },
  {
    id: "tax-stub",
    category: "commerce",
    availability: "available",
    titleKey: "features.item.taxStub.title",
    descriptionKey: "features.item.taxStub.description",
    href: "/ecom/cart",
    tourId: null,
  },
  {
    id: "tax-live",
    category: "commerce",
    availability: "upcoming",
    titleKey: "features.item.taxLive.title",
    descriptionKey: "features.item.taxLive.description",
    href: "/features",
    tourId: null,
  },
  {
    id: "account-profile",
    category: "account",
    availability: "available",
    titleKey: "features.item.accountProfile.title",
    descriptionKey: "features.item.accountProfile.description",
    href: "/account",
    tourId: "tour.account",
  },
  {
    id: "wishlist-support",
    category: "account",
    availability: "available",
    titleKey: "features.item.wishlistSupport.title",
    descriptionKey: "features.item.wishlistSupport.description",
    href: "/wishlist",
    tourId: "tour.wishlist",
  },
  {
    id: "role-portals",
    category: "portals",
    availability: "available",
    titleKey: "features.item.rolePortals.title",
    descriptionKey: "features.item.rolePortals.description",
    href: "/admin",
    tourId: "tour.portal_admin",
  },
  {
    id: "settlement-royalty",
    category: "finance",
    availability: "restricted",
    titleKey: "features.item.settlementRoyalty.title",
    descriptionKey: "features.item.settlementRoyalty.description",
    href: "/vendor",
    tourId: null,
  },
  {
    id: "zalo-oa",
    category: "platform",
    availability: "upcoming",
    titleKey: "features.item.zalo.title",
    descriptionKey: "features.item.zalo.description",
    href: "/features",
    tourId: null,
  },
  {
    id: "auth-cutover",
    category: "platform",
    availability: "upcoming",
    titleKey: "features.item.authCutover.title",
    descriptionKey: "features.item.authCutover.description",
    href: "/features",
    tourId: null,
  },
  {
    id: "i18n-tours",
    category: "platform",
    availability: "available",
    titleKey: "features.item.i18nTours.title",
    descriptionKey: "features.item.i18nTours.description",
    href: "/features",
    tourId: "tour.features",
  },
]);

/** Inline titles/descriptions so catalogs stay self-contained without bloating message files twice. */
export const featureCopy = Object.freeze({
  en: {
    "features.item.storefrontBrowse.title": "Storefront browse & search",
    "features.item.storefrontBrowse.description": "Vietnamese-friendly catalog search and product discovery.",
    "features.item.sandboxCheckout.title": "Sandbox checkout (Stripe / PayPal)",
    "features.item.sandboxCheckout.description": "Complete checkout evidence in sandbox only (DEC-PV3-001).",
    "features.item.livePv3.title": "Live payments (PV3)",
    "features.item.livePv3.description": "Live Stripe/PayPal is refused until a live go gate (DEC-PV3-001).",
    "features.item.taxStub.title": "Tax stub ($0)",
    "features.item.taxStub.description": "Address capture US+VN with tax always $0.00 (DEC-COM-001 interim).",
    "features.item.taxLive.title": "Live tax > 0",
    "features.item.taxLive.description": "Real VAT/state tables are not authorized yet.",
    "features.item.accountProfile.title": "Account & language",
    "features.item.accountProfile.description": "Profile, addresses, and EN/VI preference synced to your account.",
    "features.item.wishlistSupport.title": "Wishlist & support",
    "features.item.wishlistSupport.description": "Save books and open support tickets.",
    "features.item.rolePortals.title": "Role portals",
    "features.item.rolePortals.description": "Admin, vendor, employee, retail, B2B, institution, publisher, author shells.",
    "features.item.settlementRoyalty.title": "Settlement & royalties",
    "features.item.settlementRoyalty.description": "Interim DEC rates documented; live ACH / multi-party splits restricted.",
    "features.item.zalo.title": "Zalo OA messaging",
    "features.item.zalo.description": "Deferred until an OA id is provided (DEC-COMMS-001).",
    "features.item.authCutover.title": "Auth / region cutover",
    "features.item.authCutover.description": "US region and Auth secrets cutover remain upcoming (DEC-OPS-001).",
    "features.item.i18nTours.title": "i18n & guided tours",
    "features.item.i18nTours.description": "EN default, VI toggle, and product tours with progress tracking.",
  },
  vi: {
    "features.item.storefrontBrowse.title": "Duyệt & tìm cửa hàng",
    "features.item.storefrontBrowse.description": "Tìm kiếm danh mục thân thiện tiếng Việt và khám phá sách.",
    "features.item.sandboxCheckout.title": "Thanh toán sandbox (Stripe / PayPal)",
    "features.item.sandboxCheckout.description": "Checkout sandbox đầy đủ bằng chứng (DEC-PV3-001).",
    "features.item.livePv3.title": "Thanh toán live (PV3)",
    "features.item.livePv3.description": "Stripe/PayPal live bị từ chối đến khi có cổng go live (DEC-PV3-001).",
    "features.item.taxStub.title": "Thuế stub ($0)",
    "features.item.taxStub.description": "Địa chỉ US+VN, thuế luôn $0.00 (DEC-COM-001 tạm thời).",
    "features.item.taxLive.title": "Thuế live > 0",
    "features.item.taxLive.description": "Bảng VAT/bang chưa được ủy quyền.",
    "features.item.accountProfile.title": "Tài khoản & ngôn ngữ",
    "features.item.accountProfile.description": "Hồ sơ, địa chỉ và EN/VI đồng bộ vào tài khoản.",
    "features.item.wishlistSupport.title": "Yêu thích & hỗ trợ",
    "features.item.wishlistSupport.description": "Lưu sách và mở ticket hỗ trợ.",
    "features.item.rolePortals.title": "Cổng vai trò",
    "features.item.rolePortals.description": "Admin, vendor, employee, retail, B2B, institution, publisher, author.",
    "features.item.settlementRoyalty.title": "Đối soát & nhuận bút",
    "features.item.settlementRoyalty.description": "Tỷ lệ DEC tạm thời đã ghi; ACH live / chia đa bên bị hạn chế.",
    "features.item.zalo.title": "Nhắn tin Zalo OA",
    "features.item.zalo.description": "Hoãn đến khi có OA id (DEC-COMMS-001).",
    "features.item.authCutover.title": "Cắt Auth / vùng",
    "features.item.authCutover.description": "US region và Auth secrets vẫn sắp tới (DEC-OPS-001).",
    "features.item.i18nTours.title": "i18n & tour hướng dẫn",
    "features.item.i18nTours.description": "Mặc định EN, chuyển VI, và tour sản phẩm có theo dõi tiến độ.",
  },
});

export function featureTitle(locale, feature) {
  const pack = featureCopy[locale === "vi" ? "vi" : "en"];
  return pack[feature.titleKey] || feature.titleKey;
}

export function featureDescription(locale, feature) {
  const pack = featureCopy[locale === "vi" ? "vi" : "en"];
  return pack[feature.descriptionKey] || feature.descriptionKey;
}

export function featuresByCategory() {
  const groups = new Map();
  for (const feature of featureCatalog) {
    if (!groups.has(feature.category)) groups.set(feature.category, []);
    groups.get(feature.category).push(feature);
  }
  return groups;
}

export function availabilityFor(featureId) {
  return featureCatalog.find((item) => item.id === featureId)?.availability || null;
}
