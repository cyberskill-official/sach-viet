import assert from "node:assert/strict";
import test from "node:test";
import {
  DISPLAY_TIERS,
  PERMISSIONS,
  ROLES,
  assertPermission,
  can,
  canAccessPortal,
  canOpenFeature,
  displayTier,
  displayTierLabel,
  formatRoleForDisplay,
  normalizeRole,
  permissionForApiPath,
  requiresApiAuth,
  storefrontNavItems,
} from "../src/lib/access.mjs";

const GUEST = null;
const CUSTOMER = { id: "u1", role: "customer" };
const VENDOR = { id: "u2", role: "vendor" };
const PUBLISHER = { id: "u3", role: "publisher" };
const AUTHOR = { id: "u4", role: "author" };
const LIBRARIAN = { id: "u5", role: "school_librarian" };
const EMPLOYEE = { id: "u6", role: "employee" };
const RETAIL = { id: "u7", role: "employee_b2c" };
const B2B = { id: "u8", role: "employee_b2b" };
const ADMIN = { id: "u9", role: "admin" };
const SUPER = { id: "u10", role: "super_admin" };

test("display tiers map Guest / User / Admin for UI only", () => {
  assert.deepEqual(DISPLAY_TIERS, ["guest", "user", "admin"]);
  assert.equal(displayTier(null), "guest");
  assert.equal(displayTier("customer"), "user");
  assert.equal(displayTier("vendor"), "user");
  assert.equal(displayTier("admin"), "admin");
  assert.equal(displayTier("super_admin"), "admin");
  assert.equal(displayTierLabel(null, "en"), "Guest");
  assert.equal(displayTierLabel("customer", "en"), "User");
  assert.equal(displayTierLabel("admin", "en"), "Admin");
  assert.equal(displayTierLabel(null, "vi"), "Khách");
  assert.equal(displayTierLabel("vendor", "vi"), "Người dùng");
  assert.equal(displayTierLabel("super_admin", "vi"), "Quản trị");
  assert.equal(formatRoleForDisplay("customer", "en"), "User · customer");
  assert.equal(formatRoleForDisplay("admin", "en"), "Admin");
  assert.equal(formatRoleForDisplay(null, "en"), "Guest");
});

test("permission matrix grants public catalog to guests and all roles", () => {
  assert.equal(can(GUEST, "catalog.read"), true);
  assert.equal(can(CUSTOMER, "catalog.read"), true);
  assert.equal(can(ADMIN, "catalog.read"), true);
  assert.equal(can(GUEST, "account.read"), false);
  assert.equal(can(CUSTOMER, "account.read"), true);
});

test("permission matrix denies portal and admin APIs to wrong roles", () => {
  assert.equal(can(CUSTOMER, "portal.admin"), false);
  assert.equal(can(VENDOR, "portal.admin"), false);
  assert.equal(can(ADMIN, "portal.admin"), true);
  assert.equal(can(SUPER, "portal.admin"), true);
  assert.equal(can(VENDOR, "portal.vendor"), true);
  assert.equal(can(CUSTOMER, "portal.vendor"), false);
  assert.equal(can(CUSTOMER, "admin.flags"), false);
  assert.equal(can(ADMIN, "admin.flags"), true);
  assert.equal(can(SUPER, "admin.finance.compute"), true);
  assert.equal(can(VENDOR, "admin.finance.compute"), false);
});

test("every domain role appears in ROLES and portal permissions stay aligned", () => {
  for (const role of ROLES) {
    assert.ok(typeof role === "string");
  }
  assert.equal(normalizeRole("super_admin"), "admin");
  assert.equal(canAccessPortal("super_admin", "admin"), true);
  assert.equal(canAccessPortal("customer", "admin"), false);
  assert.equal(can(CUSTOMER, "portal.employee"), false);
  assert.equal(can(EMPLOYEE, "portal.employee"), true);
  assert.equal(can(RETAIL, "portal.retail"), true);
  assert.equal(can(B2B, "portal.b2b"), true);
  assert.equal(can(LIBRARIAN, "portal.institution"), true);
  assert.equal(can(PUBLISHER, "portal.publisher"), true);
  assert.equal(can(AUTHOR, "portal.author"), true);
});

test("assertPermission throws 401-style for guests and 403-style for wrong roles", () => {
  assert.throws(() => assertPermission(null, "account.read"), /Authentication is required/);
  assert.throws(() => assertPermission(CUSTOMER, "admin.flags"), /Access denied/);
  assert.equal(assertPermission(ADMIN, "admin.flags").role, "admin");
});

test("permissionForApiPath maps admin and partner prefixes", () => {
  assert.equal(permissionForApiPath("/api/admin/flags"), "admin.flags");
  assert.equal(permissionForApiPath("/api/admin/catalog/products", "POST"), "admin.catalog.write");
  assert.equal(permissionForApiPath("/api/admin/catalog/products", "GET"), "admin.catalog.read");
  assert.equal(permissionForApiPath("/api/finance/compute", "POST"), "admin.finance.compute");
  assert.equal(permissionForApiPath("/api/vendor/offers"), "vendor.offers");
  assert.equal(permissionForApiPath("/api/catalog/products"), "catalog.read");
  assert.equal(permissionForApiPath("/api/wishlist", "DELETE"), "wishlist.write");
});

test("requiresApiAuth covers private APIs but not public catalog or webhooks", () => {
  assert.equal(requiresApiAuth("/api/admin/flags"), true);
  assert.equal(requiresApiAuth("/api/account"), true);
  assert.equal(requiresApiAuth("/api/orders/x"), true);
  assert.equal(requiresApiAuth("/api/catalog/products"), false);
  assert.equal(requiresApiAuth("/api/quote"), false);
  assert.equal(requiresApiAuth("/api/health"), false);
  assert.equal(requiresApiAuth("/api/auth/login"), false);
  assert.equal(requiresApiAuth("/api/auth/me"), true);
});

test("storefront nav hides private links for guests and shows portal for partners", () => {
  const guestNav = storefrontNavItems(null).map((item) => item.key);
  assert.ok(guestNav.includes("login"));
  assert.ok(!guestNav.includes("account"));
  assert.ok(!guestNav.includes("wishlist"));
  assert.ok(!guestNav.includes("orders"));

  const customerNav = storefrontNavItems("customer").map((item) => item.key);
  assert.ok(customerNav.includes("account"));
  assert.ok(!customerNav.includes("portal"));

  const vendorNav = storefrontNavItems("vendor").map((item) => item.href);
  assert.ok(vendorNav.includes("/vendor"));

  const adminNav = storefrontNavItems("admin").map((item) => item.href);
  assert.ok(adminNav.includes("/admin"));
});

test("feature CTAs respect availability and role portals", () => {
  assert.equal(canOpenFeature({ availability: "upcoming", href: "/" }, "admin"), false);
  assert.equal(canOpenFeature({ availability: "restricted", href: "/vendor", permission: "vendor.payouts" }, "customer"), false);
  assert.equal(canOpenFeature({ availability: "restricted", href: "/vendor", permission: "vendor.payouts" }, "admin"), true);
  assert.equal(canOpenFeature({ id: "role-portals", availability: "available", href: "/admin" }, null), false);
  assert.equal(canOpenFeature({ id: "role-portals", availability: "available", href: "/admin" }, "customer"), false);
  assert.equal(canOpenFeature({ id: "role-portals", availability: "available", href: "/admin" }, "vendor"), true);
  assert.equal(canOpenFeature({ id: "role-portals", availability: "available", href: "/admin" }, "admin"), true);
  assert.equal(canOpenFeature({ availability: "available", href: "/account", permission: "account.read" }, null), false);
  assert.equal(canOpenFeature({ availability: "available", href: "/account", permission: "account.read" }, "customer"), true);
});

test("PERMISSIONS keys are unique and every portal permission lists admin", () => {
  const keys = Object.keys(PERMISSIONS);
  assert.equal(new Set(keys).size, keys.length);
  for (const [key, allowed] of Object.entries(PERMISSIONS)) {
    if (key.startsWith("portal.") || key.startsWith("admin.")) {
      if (allowed === "*") continue;
      assert.ok(allowed.includes("admin"), `${key} must include admin`);
    }
  }
});
