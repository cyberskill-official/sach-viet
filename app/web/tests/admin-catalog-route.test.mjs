import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("admin catalog routes use signed sessions and admin-catalog-core writers", async () => {
  const categories = readFileSync(resolve(root, "src/app/api/admin/catalog/categories/route.ts"), "utf8");
  const products = readFileSync(resolve(root, "src/app/api/admin/catalog/products/route.ts"), "utf8");
  const offers = readFileSync(resolve(root, "src/app/api/admin/catalog/offers/route.ts"), "utf8");
  for (const source of [categories, products, offers]) {
    assert.match(source, /requireApiPermission/);
    assert.match(source, /createAdminCatalogStore/);
  }
  assert.match(categories, /listAdminCategories/);
  assert.match(categories, /createAdminCategory/);
  assert.match(products, /listAdminProducts/);
  assert.match(products, /createAdminProduct/);
  assert.match(offers, /writeAdminVendorOffer/);
});
