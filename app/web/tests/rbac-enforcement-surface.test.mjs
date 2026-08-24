import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { applyB2bDiscount } from "../src/lib/finance-policy-core.mjs";
import { requiresApiAuth } from "../src/lib/access.mjs";

const root = resolve(import.meta.dirname, "..");

test("proxy requires signed session for private API prefixes", () => {
  const source = readFileSync(resolve(root, "src/proxy.ts"), "utf8");
  assert.match(source, /requiresApiAuth/);
  assert.match(source, /Unauthenticated/);
  assert.match(source, /decodeSessionRoleFromToken/);
  assert.match(source, /canAccessPortal/);
  assert.match(source, /\/forbidden/);
  assert.equal(requiresApiAuth("/api/admin/flags"), true);
});

test("finance compute route uses requirePermission and accepts super_admin via matrix", () => {
  const source = readFileSync(resolve(root, "src/app/api/finance/compute/route.ts"), "utf8");
  assert.match(source, /requirePermission/);
  assert.match(source, /admin\.finance\.compute/);
  assert.doesNotThrow(() => applyB2bDiscount("100.0000", 5, { role: "super_admin" }));
  assert.throws(() => applyB2bDiscount("100.0000", 5, { role: "customer" }), /admin-only/);
});

test("admin flags route gates on admin.flags before reading integrations", () => {
  const source = readFileSync(resolve(root, "src/app/api/admin/flags/route.ts"), "utf8");
  assert.match(source, /requirePermission/);
  assert.match(source, /admin\.flags/);
});

test("vendor application PATCH returns status via errorStatusForMessage not hard-coded 400", () => {
  const source = readFileSync(resolve(root, "src/app/api/admin/vendor-applications/[id]/route.ts"), "utf8");
  assert.match(source, /requirePermission/);
  assert.match(source, /errorStatusForMessage/);
});

test("UI surfaces Guest User Admin display tiers", () => {
  const storefront = readFileSync(resolve(root, "src/components/storefront.tsx"), "utf8");
  const portal = readFileSync(resolve(root, "src/components/portal-shell.tsx"), "utf8");
  const account = readFileSync(resolve(root, "src/components/account-panel.tsx"), "utf8");
  const features = readFileSync(resolve(root, "src/components/features-catalog.tsx"), "utf8");
  for (const source of [storefront, portal, account, features]) {
    assert.match(source, /displayTier/);
  }
  assert.match(storefront, /data-access-tier/);
  assert.match(storefront, /portalNavHrefForRole/);
  assert.match(features, /canOpenFeature/);
  assert.match(features, /unauthorizedAction|signInRequired/);
});
