import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  addProductMedia,
  createCatalogStore,
  createCategory,
  createProduct,
  createProductVariant,
  getPublicProduct,
  listPublicProducts,
  normalizeMoney,
  selectPrimaryOffer,
  writeVendorOffer,
} from "../src/lib/catalog-core.mjs";

function withStore(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-catalog-"));
  const store = createCatalogStore({ dbPath: join(directory, "catalog.sqlite"), log: () => {} });
  try {
    return run(store);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

function catalogFixture(store) {
  createCategory(store, { slug: "books", name: "Books" });
  const product = createProduct(store, { categorySlug: "books", slug: "clean-code", title: "Clean Code", description: "A book" });
  return { product, vendorA: { id: "vendor-a", role: "vendor" }, vendorB: { id: "vendor-b", role: "vendor" }, admin: { id: "admin", role: "admin" } };
}

test("catalog products reject offer fields and schema keeps them off products", () => withStore((store) => {
  createCategory(store, { slug: "books", name: "Books" });
  assert.throws(() => createProduct(store, { categorySlug: "books", slug: "clean-code", title: "Clean Code", priceUsd: "9.99" }), /cannot contain offer data/);
  const fields = store.db.prepare("PRAGMA table_info(products)").all().map((column) => column.name);
  assert.equal(fields.includes("price_usd"), false);
  assert.equal(fields.includes("list_price_usd"), false);
  assert.equal(fields.includes("stock_quantity"), false);
}));

test("primary offer chooses the lowest eligible offer and excludes inactive or empty stock", () => withStore((store) => {
  const { product, vendorA, vendorB } = catalogFixture(store);
  const eligible = writeVendorOffer(store, vendorA, { productId: product.id, vendorId: vendorA.id, priceUsd: "7.50", listPriceUsd: "9.00", stockQuantity: 1 });
  writeVendorOffer(store, vendorB, { productId: product.id, vendorId: vendorB.id, priceUsd: "5.00", stockQuantity: 0 });
  writeVendorOffer(store, vendorB, { productId: product.id, vendorId: vendorB.id, priceUsd: "4.00", stockQuantity: 2, isActive: false });
  assert.deepEqual(selectPrimaryOffer(store, product.id), { id: eligible.id, priceUsd: "7.5000", listPriceUsd: "9.0000", stockQuantity: 1 });
}));

test("primary offer uses vendor ID as a stable tie-breaker", () => withStore((store) => {
  const { product, vendorA, vendorB } = catalogFixture(store);
  writeVendorOffer(store, vendorB, { productId: product.id, vendorId: vendorB.id, priceUsd: "5", stockQuantity: 4 });
  const winner = writeVendorOffer(store, vendorA, { productId: product.id, vendorId: vendorA.id, priceUsd: "5.0000", stockQuantity: 2 });
  assert.deepEqual(selectPrimaryOffer(store, product.id), { id: winner.id, priceUsd: "5.0000", listPriceUsd: null, stockQuantity: 2 });
}));

test("catalog public reads include product facts and the buy box without vendor disclosure", () => withStore((store) => {
  const { product, vendorA } = catalogFixture(store);
  addProductMedia(store, { productId: product.id, url: "https://example.test/cover.jpg", altText: "Cover" });
  createProductVariant(store, { productId: product.id, sku: "clean-code-hardcover", title: "Hardcover", attributes: { format: "hardcover" } });
  const offer = writeVendorOffer(store, vendorA, { productId: product.id, vendorId: vendorA.id, priceUsd: "12.5", stockQuantity: 3 });
  const publicProduct = getPublicProduct(store, "clean-code");
  assert.equal(publicProduct.primaryOffer.id, offer.id);
  assert.equal(publicProduct.primaryOffer.priceUsd, "12.5000");
  assert.equal(JSON.stringify(publicProduct).includes("vendor-a"), false);
  assert.equal(listPublicProducts(store, { category: "books" }).length, 1);
}));

test("offer writes enforce vendor ownership while administrators can act for a vendor", () => withStore((store) => {
  const { product, vendorA, vendorB, admin } = catalogFixture(store);
  const offer = writeVendorOffer(store, vendorA, { productId: product.id, vendorId: vendorA.id, priceUsd: "10", stockQuantity: 1 });
  assert.throws(() => writeVendorOffer(store, vendorB, { id: offer.id, productId: product.id, vendorId: vendorB.id, priceUsd: "8", stockQuantity: 1 }), /cannot change/);
  const updated = writeVendorOffer(store, admin, { id: offer.id, productId: product.id, vendorId: vendorB.id, priceUsd: "8", stockQuantity: 1 });
  assert.equal(updated.vendorId, "vendor-b");
}));

test("money values use canonical decimal USD strings", () => {
  assert.equal(normalizeMoney("12.5"), "12.5000");
  assert.equal(normalizeMoney(0), "0.0000");
  assert.throws(() => normalizeMoney("1.00001"), /decimal USD/);
});
