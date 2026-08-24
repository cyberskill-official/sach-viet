import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { can, canRole, normalizeRole, assertPermission } from "../src/lib/access.mjs";
import { applyB2bDiscount } from "../src/lib/finance-policy-core.mjs";

const root = resolve(import.meta.dirname, "..");

test("authz-http exports session and permission helpers used by routes", () => {
  const source = readFileSync(resolve(root, "src/lib/authz-http.mjs"), "utf8");
  assert.match(source, /export async function requireSession/);
  assert.match(source, /export async function requirePermission/);
  assert.match(source, /export async function requireApiPermission/);
  assert.match(source, /permissionForApiPath/);
  assert.match(source, /API_ERROR_CODES\.unauthenticated/);
  assert.match(source, /API_ERROR_CODES\.forbidden/);
  assert.match(source, /export function requirePermissionOrThrow/);
});

test("permission helpers reject guests and wrong roles (authz throw path)", () => {
  assert.throws(() => assertPermission(null, "account.read"), /Authentication is required/);
  assert.throws(() => assertPermission({ role: "customer", id: "c1" }, "admin.flags"), /Access denied/);
  assert.throws(() => assertPermission({ role: "vendor", id: "v1" }, "portal.admin"), /Access denied/);
  assert.equal(assertPermission({ role: "admin", id: "a1" }, "admin.flags").id, "a1");
  assert.equal(assertPermission({ role: "super_admin", id: "s1" }, "admin.finance.compute").id, "s1");
  assert.equal(assertPermission({ role: "vendor", id: "v1" }, "vendor.offers").role, "vendor");
});

test("super_admin alias flows through finance discount and permission matrix", () => {
  assert.equal(normalizeRole("super_admin"), "admin");
  assert.equal(canRole("super_admin", "admin.b2b.discount"), true);
  assert.equal(can({ id: "s1", role: "super_admin" }, "admin.b2b.discount"), true);
  assert.doesNotThrow(() => applyB2bDiscount("100.0000", 10, { role: "super_admin" }));
  assert.throws(() => applyB2bDiscount("100.0000", 10, { role: "employee_b2b" }), /admin-only/);
});

test("critical routes import authz helpers for defense in depth", () => {
  const flags = readFileSync(resolve(root, "src/app/api/admin/flags/route.ts"), "utf8");
  const finance = readFileSync(resolve(root, "src/app/api/finance/compute/route.ts"), "utf8");
  const vendorApp = readFileSync(resolve(root, "src/app/api/admin/vendor-applications/[id]/route.ts"), "utf8");
  for (const source of [flags, finance, vendorApp]) {
    assert.match(source, /requirePermission/);
  }
});
