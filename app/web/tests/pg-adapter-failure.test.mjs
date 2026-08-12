import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import { createCommerceStore, createPendingOrder } from "../src/lib/commerce-core.mjs";

test("injected adapter failure after the first checkout write rolls back stock and order", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-pg-fail-"));
  const dbPath = join(directory, "fail.sqlite");
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const commerce = await createCommerceStore({ dbPath, log: () => {} });
  try {
    await createCategory(catalog, { slug: "books", name: "Books" });
    const product = await createProduct(catalog, { categorySlug: "books", slug: "book", title: "A Book" });
    const offer = await writeVendorOffer(
      catalog,
      { id: "vendor-1", role: "vendor" },
      { productId: product.id, vendorId: "vendor-1", priceUsd: "12.50", stockQuantity: 2 },
    );
    commerce.db.injectFailureAfterWrites(1);
    await assert.rejects(
      () => createPendingOrder(commerce, { id: "customer-1", role: "customer" }, [{ vendorOfferId: offer.id, quantity: 1 }]),
      /injected adapter failure/,
    );
    assert.equal((await catalog.db.prepare("SELECT stock_quantity FROM vendor_offers WHERE id = ?").get(offer.id)).stock_quantity, 2);
    assert.equal((await commerce.db.prepare("SELECT COUNT(*) AS count FROM orders").get()).count, 0);
    assert.equal((await commerce.db.prepare("SELECT COUNT(*) AS count FROM order_items").get()).count, 0);
  } finally {
    await commerce.close();
    await catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
