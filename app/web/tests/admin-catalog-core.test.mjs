import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  createAdminCatalogStore,
  createAdminCategory,
  createAdminProduct,
  listAdminCategories,
  listAdminProducts,
  writeAdminVendorOffer,
} from "../src/lib/admin-catalog-core.mjs";
import { getPublicProduct } from "../src/lib/catalog-core.mjs";

function withStore(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-admin-catalog-"));
  const store = createAdminCatalogStore({ dbPath: join(directory, "catalog.sqlite"), log: () => {} });
  try {
    return run(store);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("admin catalog writes require administrator and reuse catalog-core product/offer split", () => withStore((store) => {
  const admin = { id: "admin-1", role: "admin" };
  const customer = { id: "customer-1", role: "customer" };
  assert.throws(() => createAdminCategory(store, customer, { slug: "books", name: "Books" }), /Administrator/);
  const category = createAdminCategory(store, admin, { slug: "books", name: "Books" });
  assert.equal(listAdminCategories(store, admin).length, 1);
  assert.throws(() => createAdminProduct(store, admin, {
    categorySlug: "books",
    slug: "clean-code",
    title: "Clean Code",
    priceUsd: "9.99",
  }), /cannot contain offer data/);
  const created = createAdminProduct(store, admin, {
    categoryId: category.id,
    slug: "clean-code",
    title: "Clean Code",
    variant: { sku: "clean-code-pb", title: "Paperback" },
  });
  assert.equal(created.variants.length, 1);
  const offer = writeAdminVendorOffer(store, admin, {
    productId: created.product.id,
    variantId: created.variants[0].id,
    priceUsd: "12.5",
    stockQuantity: 3,
  });
  assert.equal(offer.vendorId, "admin-1");
  assert.equal(offer.priceUsd, "12.5000");
  const products = listAdminProducts(store, admin);
  assert.equal(products.length, 1);
  assert.equal(products[0].primaryOffer.id, offer.id);
  assert.equal(getPublicProduct(store, "clean-code").primaryOffer.id, offer.id);
}));

test("admin catalog offer accepts an explicit vendor id", () => withStore((store) => {
  const admin = { id: "admin-1", role: "admin" };
  createAdminCategory(store, admin, { slug: "books", name: "Books" });
  const created = createAdminProduct(store, admin, { categorySlug: "books", slug: "refactoring", title: "Refactoring" });
  const offer = writeAdminVendorOffer(store, admin, {
    productId: created.product.id,
    vendorId: "platform-vendor",
    priceUsd: "8",
    stockQuantity: 1,
  });
  assert.equal(offer.vendorId, "platform-vendor");
}));
