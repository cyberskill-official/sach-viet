import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { listTableColumns } from "../src/lib/db.mjs";
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

async function withStore(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-catalog-"));
  const store = await createCatalogStore({ dbPath: join(directory, "catalog.sqlite"), log: () => {} });
  try {
    return await run(store);
  } finally {
    await store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

async function catalogFixture(store) {
  await createCategory(store, { slug: "books", name: "Books" });
  const product = await createProduct(store, { categorySlug: "books", slug: "clean-code", title: "Clean Code", description: "A book" });
  return { product, vendorA: { id: "vendor-a", role: "vendor" }, vendorB: { id: "vendor-b", role: "vendor" }, admin: { id: "admin", role: "admin" } };
}

test("catalog products reject offer fields and schema keeps them off products", async () => withStore(async (store) => {
  await createCategory(store, { slug: "books", name: "Books" });
  await assert.rejects(async () => await createProduct(store, { categorySlug: "books", slug: "clean-code", title: "Clean Code", priceUsd: "9.99" }), /cannot contain offer data/);
  const fields = (await listTableColumns(store.db, "products")).map((column) => column.name);
  assert.equal(fields.includes("price_usd"), false);
  assert.equal(fields.includes("list_price_usd"), false);
  assert.equal(fields.includes("stock_quantity"), false);
}));

test("primary offer chooses the lowest eligible offer and excludes inactive or empty stock", async () => withStore(async (store) => {
  const { product, vendorA, vendorB } = await catalogFixture(store);
  const eligible = await writeVendorOffer(store, vendorA, { productId: product.id, vendorId: vendorA.id, priceUsd: "7.50", listPriceUsd: "9.00", stockQuantity: 1 });
  await writeVendorOffer(store, vendorB, { productId: product.id, vendorId: vendorB.id, priceUsd: "5.00", stockQuantity: 0 });
  await writeVendorOffer(store, vendorB, { productId: product.id, vendorId: vendorB.id, priceUsd: "4.00", stockQuantity: 2, isActive: false });
  assert.deepEqual(await selectPrimaryOffer(store, product.id), { id: eligible.id, priceUsd: "7.5000", listPriceUsd: "9.0000", stockQuantity: 1 });
}));

test("primary offer uses vendor ID as a stable tie-breaker", async () => withStore(async (store) => {
  const { product, vendorA, vendorB } = await catalogFixture(store);
  await writeVendorOffer(store, vendorB, { productId: product.id, vendorId: vendorB.id, priceUsd: "5", stockQuantity: 4 });
  const winner = await writeVendorOffer(store, vendorA, { productId: product.id, vendorId: vendorA.id, priceUsd: "5.0000", stockQuantity: 2 });
  assert.deepEqual(await selectPrimaryOffer(store, product.id), { id: winner.id, priceUsd: "5.0000", listPriceUsd: null, stockQuantity: 2 });
}));

test("catalog public reads include product facts and the buy box without vendor disclosure", async () => withStore(async (store) => {
  const { product, vendorA } = await catalogFixture(store);
  await addProductMedia(store, { productId: product.id, url: "https://example.test/cover.jpg", altText: "Cover" });
  await createProductVariant(store, { productId: product.id, sku: "clean-code-hardcover", title: "Hardcover", attributes: { format: "hardcover" } });
  const offer = await writeVendorOffer(store, vendorA, { productId: product.id, vendorId: vendorA.id, priceUsd: "12.5", stockQuantity: 3 });
  const publicProduct = await getPublicProduct(store, "clean-code");
  assert.equal(publicProduct.primaryOffer.id, offer.id);
  assert.equal(publicProduct.primaryOffer.priceUsd, "12.5000");
  assert.equal(JSON.stringify(publicProduct).includes("vendor-a"), false);
  assert.equal((await listPublicProducts(store, { category: "books" })).length, 1);
}));

test("offer writes enforce vendor ownership while administrators can act for a vendor", async () => withStore(async (store) => {
  const { product, vendorA, vendorB, admin } = await catalogFixture(store);
  const offer = await writeVendorOffer(store, vendorA, { productId: product.id, vendorId: vendorA.id, priceUsd: "10", stockQuantity: 1 });
  await assert.rejects(async () => await writeVendorOffer(store, vendorB, { id: offer.id, productId: product.id, vendorId: vendorB.id, priceUsd: "8", stockQuantity: 1 }), /cannot change/);
  const updated = await writeVendorOffer(store, admin, { id: offer.id, productId: product.id, vendorId: vendorB.id, priceUsd: "8", stockQuantity: 1 });
  assert.equal(updated.vendorId, "vendor-b");
}));

test("customers cannot write vendor offers even when the vendorId matches their user id", async () => withStore(async (store) => {
  const { product } = await catalogFixture(store);
  await assert.rejects(
    async () =>
      writeVendorOffer(store, { id: "vendor-a", role: "customer" }, {
        productId: product.id,
        vendorId: "vendor-a",
        priceUsd: "1.00",
        stockQuantity: 1,
      }),
    /cannot write this vendor offer/,
  );
}));

test("money values use canonical decimal USD strings", async () => {
  assert.equal(normalizeMoney("12.5"), "12.5000");
  assert.equal(normalizeMoney(0), "0.0000");
  assert.throws(() => normalizeMoney("1.00001"), /decimal USD/);
});

test("public catalog lists page with an after cursor", async () => withStore(async (store) => {
  await createCategory(store, { slug: "books", name: "Books" });
  const first = await createProduct(store, { categorySlug: "books", slug: "alpha", title: "Alpha" });
  await createProduct(store, { categorySlug: "books", slug: "beta", title: "Beta" });
  const page = await listPublicProducts(store, { limit: 1 });
  assert.equal(page.length, 1);
  assert.equal(page[0].id, first.id);
  const next = await listPublicProducts(store, { limit: 1, after: page[0].id });
  assert.equal(next.length, 1);
  assert.notEqual(next[0].id, page[0].id);
}));
