import assert from "node:assert/strict";
import test from "node:test";
import { defaultHomeForRole, portalForPath, requiresAuthPath } from "../src/lib/access.mjs";

test("requiresAuthPath gates account, wishlist, and order history", () => {
  assert.equal(requiresAuthPath("/account"), true);
  assert.equal(requiresAuthPath("/account/addresses"), true);
  assert.equal(requiresAuthPath("/wishlist"), true);
  assert.equal(requiresAuthPath("/wishlist/x"), true);
  assert.equal(requiresAuthPath("/ecom/orders"), true);
  assert.equal(requiresAuthPath("/ecom/orders/ord_1"), true);
  assert.equal(requiresAuthPath("/ecom/cart"), false);
  assert.equal(requiresAuthPath("/support"), false);
  assert.equal(requiresAuthPath("/"), false);
  assert.equal(requiresAuthPath(""), false);
});

test("portalForPath still resolves role portals only", () => {
  assert.equal(portalForPath("/admin"), "admin");
  assert.equal(portalForPath("/account"), null);
  assert.equal(portalForPath("/ecom/orders"), null);
});

test("defaultHomeForRole sends admins to portal not storefront", () => {
  assert.equal(defaultHomeForRole("admin"), "/admin");
  assert.equal(defaultHomeForRole("super_admin"), "/admin");
  assert.equal(defaultHomeForRole("customer"), "/account");
  assert.equal(defaultHomeForRole("vendor"), "/vendor");
});
