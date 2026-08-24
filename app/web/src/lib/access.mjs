/**
 * Central RBAC for SachViet.
 *
 * Domain roles remain the source of truth (customer, vendor, portals, admin…).
 * Display tiers Guest / User / Admin are UI labels only — they do not replace roles.
 */

export const ROLES = Object.freeze([
  "customer",
  "vendor",
  "publisher",
  "author",
  "school_librarian",
  "employee",
  "employee_b2c",
  "employee_b2b",
  "employee_supplier",
  "admin",
  "super_admin",
]);

/** Coarse UI tiers — never use these for authorization decisions. */
export const DISPLAY_TIERS = Object.freeze(["guest", "user", "admin"]);

export const DISPLAY_TIER_LABELS = Object.freeze({
  en: Object.freeze({ guest: "Guest", user: "User", admin: "Admin" }),
  vi: Object.freeze({ guest: "Khách", user: "Người dùng", admin: "Quản trị" }),
});

const ALL_AUTHENTICATED = Object.freeze([...ROLES]);

const portalRoles = Object.freeze({
  admin: ["admin"],
  vendor: ["vendor", "admin"],
  publisher: ["publisher", "admin"],
  author: ["author", "admin"],
  institution: ["school_librarian", "admin"],
  employee: ["admin", "employee", "employee_b2c", "employee_b2b"],
  retail: ["employee_b2c", "admin"],
  b2b: ["employee_b2b", "admin"],
  supplier: ["employee_supplier", "admin"],
});

/**
 * Permission matrix: permission key → allowed domain roles.
 * Use `"*"` for public (guest + any authenticated role).
 * Authorization must call `can` / `assertPermission` — never trust display tiers.
 */
export const PERMISSIONS = Object.freeze({
  // Public
  "catalog.read": "*",
  "quote.create": "*",
  "finance.policy.read": "*",
  "returns.policy.read": "*",
  "auth.register": "*",
  "auth.login": "*",
  "auth.verify": "*",
  "auth.forgot": "*",
  "auth.reset": "*",
  "features.read": "*",
  "support.page.read": "*",

  // Any authenticated domain role (display tier User or Admin)
  "account.read": ALL_AUTHENTICATED,
  "account.write": ALL_AUTHENTICATED,
  "wishlist.read": ALL_AUTHENTICATED,
  "wishlist.write": ALL_AUTHENTICATED,
  "orders.read.own": ALL_AUTHENTICATED,
  "checkout.create": ALL_AUTHENTICATED,
  "support.tickets.own": ALL_AUTHENTICATED,
  "notifications.own": ALL_AUTHENTICATED,
  "storage.upload": ALL_AUTHENTICATED,
  "vendor.apply": ALL_AUTHENTICATED,
  "auth.me": ALL_AUTHENTICATED,
  "auth.logout": ALL_AUTHENTICATED,

  // Portal shells (aligned with portalRoles)
  "portal.admin": portalRoles.admin,
  "portal.vendor": portalRoles.vendor,
  "portal.publisher": portalRoles.publisher,
  "portal.author": portalRoles.author,
  "portal.institution": portalRoles.institution,
  "portal.employee": portalRoles.employee,
  "portal.retail": portalRoles.retail,
  "portal.b2b": portalRoles.b2b,
  "portal.supplier": portalRoles.supplier,

  // Admin domain
  "admin.commerce.read": ["admin"],
  "admin.catalog.read": ["admin"],
  "admin.catalog.write": ["admin"],
  "admin.vendors.review": ["admin"],
  "admin.payouts": ["admin"],
  "admin.flags": ["admin"],
  "admin.integrations": ["admin"],
  "admin.finance.compute": ["admin"],
  "admin.ai": ["admin"],
  "admin.wordpress": ["admin"],
  "admin.b2b.discount": ["admin"],

  // Partner / staff domain APIs
  "vendor.dashboard": portalRoles.vendor,
  "vendor.offers": portalRoles.vendor,
  "vendor.orders": portalRoles.vendor,
  "vendor.payouts": portalRoles.vendor,
  "vendor.notifications": portalRoles.vendor,
  "publisher.dashboard": portalRoles.publisher,
  "publisher.requests": portalRoles.publisher,
  "publisher.marc": portalRoles.publisher,
  "author.dashboard": portalRoles.author,
  "author.requests": portalRoles.author,
  "institution.quotes": portalRoles.institution,
  "institution.orders": portalRoles.institution,
  "institution.budget": portalRoles.institution,
  "institution.marc": portalRoles.institution,
  "institution.lists": portalRoles.institution,
  "employee.dashboard": portalRoles.employee,
  "employee.home": portalRoles.employee,
  "retail.orders": portalRoles.retail,
  "b2b.organizations": portalRoles.b2b,
  "b2b.quotes": portalRoles.b2b,
  "b2b.orders": portalRoles.b2b,
  "b2b.marc": portalRoles.b2b,
  "support.tickets.staff": ["admin", "employee", "employee_b2c", "employee_b2b"],
});

/** API path prefixes that require a signed session (role checked in handlers). */
const apiAuthPrefixes = Object.freeze([
  "/api/account",
  "/api/admin",
  "/api/vendor",
  "/api/publisher",
  "/api/author",
  "/api/institution",
  "/api/employee",
  "/api/retail",
  "/api/b2b",
  "/api/orders",
  "/api/wishlist",
  "/api/checkout",
  "/api/notifications",
  "/api/support",
  "/api/storage",
  "/api/finance/compute",
  "/api/auth/me",
  "/api/auth/logout",
]);

/** Map API pathname → permission (first match wins). */
const apiPermissionRules = Object.freeze([
  { prefix: "/api/admin/catalog", permission: "admin.catalog.read", writePermission: "admin.catalog.write" },
  { prefix: "/api/admin/vendor-applications", permission: "admin.vendors.review" },
  { prefix: "/api/admin/payouts", permission: "admin.payouts" },
  { prefix: "/api/admin/flags", permission: "admin.flags" },
  { prefix: "/api/admin/integrations", permission: "admin.integrations" },
  { prefix: "/api/admin/ai", permission: "admin.ai" },
  { prefix: "/api/admin/wordpress-import", permission: "admin.wordpress" },
  { prefix: "/api/admin/commerce", permission: "admin.commerce.read" },
  { prefix: "/api/admin", permission: "portal.admin" },
  { prefix: "/api/finance/compute", permission: "admin.finance.compute" },
  { prefix: "/api/vendor/offers", permission: "vendor.offers" },
  { prefix: "/api/vendor/orders", permission: "vendor.orders" },
  { prefix: "/api/vendor/payouts", permission: "vendor.payouts" },
  { prefix: "/api/vendor/applications", permission: "vendor.apply" },
  { prefix: "/api/vendor/notification-preferences", permission: "vendor.notifications" },
  { prefix: "/api/vendor", permission: "vendor.dashboard" },
  { prefix: "/api/publisher/publishing-requests", permission: "publisher.requests" },
  { prefix: "/api/publisher/marc", permission: "publisher.marc" },
  { prefix: "/api/publisher", permission: "publisher.dashboard" },
  { prefix: "/api/author/manuscript-requests", permission: "author.requests" },
  { prefix: "/api/author", permission: "author.dashboard" },
  { prefix: "/api/institution/quotes", permission: "institution.quotes" },
  { prefix: "/api/institution/orders", permission: "institution.orders" },
  { prefix: "/api/institution/budget", permission: "institution.budget" },
  { prefix: "/api/institution/marc", permission: "institution.marc" },
  { prefix: "/api/institution/selection-lists", permission: "institution.lists" },
  { prefix: "/api/institution", permission: "portal.institution" },
  { prefix: "/api/employee/home-sections", permission: "employee.home" },
  { prefix: "/api/employee", permission: "employee.dashboard" },
  { prefix: "/api/retail", permission: "retail.orders" },
  { prefix: "/api/b2b/organizations", permission: "b2b.organizations" },
  { prefix: "/api/b2b/quotes", permission: "b2b.quotes" },
  { prefix: "/api/b2b/orders", permission: "b2b.orders" },
  { prefix: "/api/b2b/marc", permission: "b2b.marc" },
  { prefix: "/api/b2b", permission: "portal.b2b" },
  { prefix: "/api/account", permission: "account.read", writePermission: "account.write" },
  { prefix: "/api/wishlist", permission: "wishlist.read", writePermission: "wishlist.write" },
  { prefix: "/api/orders", permission: "orders.read.own" },
  { prefix: "/api/checkout", permission: "checkout.create" },
  { prefix: "/api/notifications", permission: "notifications.own" },
  { prefix: "/api/support", permission: "support.tickets.own" },
  { prefix: "/api/storage", permission: "storage.upload" },
  { prefix: "/api/auth/me", permission: "auth.me" },
  { prefix: "/api/auth/logout", permission: "auth.logout" },
  { prefix: "/api/catalog", permission: "catalog.read" },
  { prefix: "/api/quote", permission: "quote.create" },
  { prefix: "/api/finance/policy", permission: "finance.policy.read" },
  { prefix: "/api/returns/policy", permission: "returns.policy.read" },
]);

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function normalizeRole(role) {
  return role === "super_admin" ? "admin" : role;
}

export function isKnownRole(role) {
  return ROLES.includes(role);
}

export function isAdminRole(role) {
  return normalizeRole(role) === "admin";
}

/**
 * Map session role (or null) to a display-only tier for UI badges/labels.
 * @param {string | null | undefined} role
 * @returns {"guest" | "user" | "admin"}
 */
export function displayTier(role) {
  if (!role) return "guest";
  if (isAdminRole(role)) return "admin";
  if (isKnownRole(role) || typeof role === "string") return "user";
  return "guest";
}

/**
 * Localized Guest / User / Admin label for UI.
 * @param {string | null | undefined} role
 * @param {"en" | "vi"} [locale]
 */
export function displayTierLabel(role, locale = "en") {
  const tier = displayTier(role);
  const pack = DISPLAY_TIER_LABELS[locale === "vi" ? "vi" : "en"];
  return pack[tier] || tier;
}

/**
 * Human-readable role line for account UI: "User · customer" / "Admin".
 * @param {string | null | undefined} role
 * @param {"en" | "vi"} [locale]
 */
export function formatRoleForDisplay(role, locale = "en") {
  const tier = displayTier(role);
  const tierLabel = displayTierLabel(role, locale);
  if (tier === "guest") return tierLabel;
  if (tier === "admin") return tierLabel;
  const domain = typeof role === "string" && role ? role : "customer";
  return `${tierLabel} · ${domain}`;
}

export function rolesForPermission(permission) {
  const allowed = PERMISSIONS[permission];
  if (allowed === "*") return "*";
  if (Array.isArray(allowed)) return allowed;
  return null;
}

/**
 * @param {{ role?: string, id?: string } | null | undefined} user
 * @param {string} permission
 */
export function can(user, permission) {
  const allowed = PERMISSIONS[permission];
  if (allowed === undefined) return false;
  if (allowed === "*") return true;
  if (!user?.id || !user?.role) return false;
  const role = normalizeRole(user.role);
  return allowed.includes(role) || allowed.includes(user.role);
}

/**
 * Role-only check for UI gating (nav / feature CTAs). Server paths must use `can(user)`.
 * @param {string | null | undefined} role
 * @param {string} permission
 */
export function canRole(role, permission) {
  const allowed = PERMISSIONS[permission];
  if (allowed === undefined) return false;
  if (allowed === "*") return true;
  if (!role) return false;
  const normalized = normalizeRole(role);
  return allowed.includes(normalized) || allowed.includes(role);
}

/**
 * @param {{ role?: string, id?: string } | null | undefined} user
 * @param {string} permission
 * @param {string} [message]
 */
export function assertPermission(user, permission, message) {
  const allowed = PERMISSIONS[permission];
  if (allowed === "*") return user;
  if (!user?.id || !user?.role) throw new Error("Authentication is required.");
  if (can(user, permission)) return user;
  throw new Error(message || "Access denied.");
}

export function canAccessPortal(role, portal) {
  const allowed = portalRoles[portal];
  return Boolean(allowed && allowed.includes(normalizeRole(role)));
}

export function canAccessOwnedRecord(user, ownerId) {
  return Boolean(user && (isAdminRole(user.role) || user.id === ownerId));
}

/** Vendor offers may be written by the vendor owner or an admin — never by a customer who happens to share an id. */
export function canWriteVendorOffer(user, vendorId) {
  if (!user?.id) return false;
  const role = normalizeRole(user.role);
  if (role === "admin") return true;
  return role === "vendor" && user.id === vendorId;
}

export function portalForPath(pathname) {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment && Object.hasOwn(portalRoles, segment) ? segment : null;
}

/** Default post-login destination when redirect is missing or `/`. */
export function defaultHomeForRole(role) {
  switch (normalizeRole(role)) {
    case "admin":
      return "/admin";
    case "vendor":
      return "/vendor";
    case "publisher":
      return "/publisher";
    case "author":
      return "/author";
    case "school_librarian":
      return "/institution";
    case "employee":
    case "employee_b2c":
      return "/retail";
    case "employee_b2b":
      return "/b2b";
    case "employee_supplier":
      return "/supplier";
    default:
      return "/account";
  }
}

/** B2C private pages that must redirect anonymous users to login (audit H4). */
const privateB2cPrefixes = Object.freeze([
  "/account",
  "/wishlist",
  "/ecom/orders",
]);

export function requiresAuthPath(pathname) {
  if (typeof pathname !== "string" || pathname === "") return false;
  return privateB2cPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Whether an API path requires a signed session cookie (role still checked in handlers).
 * @param {string} pathname
 */
export function requiresApiAuth(pathname) {
  if (typeof pathname !== "string" || !pathname.startsWith("/api/")) return false;
  return apiAuthPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Resolve the permission key for an API path + method.
 * @param {string} pathname
 * @param {string} [method]
 * @returns {string | null}
 */
export function permissionForApiPath(pathname, method = "GET") {
  if (typeof pathname !== "string") return null;
  for (const rule of apiPermissionRules) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      if (MUTATING.has(String(method).toUpperCase()) && rule.writePermission) {
        return rule.writePermission;
      }
      return rule.permission;
    }
  }
  return null;
}

/**
 * Storefront / features nav items visible for a session role.
 * Guests only see public links; authenticated users see account surfaces;
 * portal link only when the role has a dedicated portal home.
 * @param {string | null | undefined} role
 * @returns {{ href: string, key: string, requiresAuth?: boolean }[]}
 */
export function storefrontNavItems(role) {
  const tier = displayTier(role);
  const items = [];
  if (tier === "guest") {
    items.push(
      { href: "/features", key: "features" },
      { href: "/support", key: "support" },
      { href: "/ecom/cart", key: "cart" },
      { href: "/register", key: "register" },
      { href: "/login", key: "login" },
    );
    return items;
  }
  items.push(
    { href: "/features", key: "features" },
    { href: "/account", key: "account", requiresAuth: true },
    { href: "/wishlist", key: "wishlist", requiresAuth: true },
    { href: "/support", key: "support" },
    { href: "/ecom/orders", key: "orders", requiresAuth: true },
    { href: "/ecom/cart", key: "cart" },
  );
  const home = defaultHomeForRole(role);
  const portal = portalForPath(home);
  if (home !== "/account" && portal && canAccessPortal(role, portal)) {
    items.push({ href: home, key: "portal", requiresAuth: true });
  }
  return items;
}

/**
 * Whether a features-catalog CTA may open for this role.
 * @param {{ href?: string, permission?: string, availability?: string, id?: string }} feature
 * @param {string | null | undefined} role
 */
export function canOpenFeature(feature, role) {
  if (!feature || feature.availability === "upcoming") return false;
  if (feature.availability === "restricted" && displayTier(role) !== "admin") return false;
  if (feature.id === "role-portals") {
    if (!role) return false;
    const home = defaultHomeForRole(role);
    const portal = portalForPath(home);
    return Boolean(portal && canAccessPortal(role, portal));
  }
  if (feature.permission) return canRole(role, feature.permission);
  const href = feature.href || "";
  const portal = portalForPath(href);
  if (portal) return canAccessPortal(role, portal);
  if (requiresAuthPath(href)) return Boolean(role);
  return true;
}

/** Permission key for a portal slug. */
export function permissionForPortal(portal) {
  return portal && Object.hasOwn(portalRoles, portal) ? `portal.${portal}` : null;
}

export { portalRoles };
