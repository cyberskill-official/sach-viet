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

export function normalizeRole(role) {
  return role === "super_admin" ? "admin" : role;
}

export function isKnownRole(role) {
  return ROLES.includes(role);
}

export function canAccessPortal(role, portal) {
  const allowed = portalRoles[portal];
  return Boolean(allowed && allowed.includes(normalizeRole(role)));
}

export function canAccessOwnedRecord(user, ownerId) {
  return Boolean(user && (normalizeRole(user.role) === "admin" || user.id === ownerId));
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
