import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogStore, createCategory, createProduct } from "../src/lib/catalog-core.mjs";
import { addWishlistItem, createWishlistStore, listWishlist, removeWishlistItem } from "../src/lib/wishlist-core.mjs";

test("customers can add list and remove wishlist items for existing products", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-wishlist-"));
  const dbPath = join(directory, "wish.sqlite");
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const store = await createWishlistStore({ dbPath, log: () => {} });
  try {
    await createCategory(catalog, { slug: "books", name: "Books" });
    const product = await createProduct(catalog, { categorySlug: "books", slug: "kieu", title: "Truyện Kiều" });
    const user = { id: "cust-1", role: "customer" };
    await assert.rejects(async () => addWishlistItem(store, null, product.id), /Authentication/);
    await assert.rejects(async () => addWishlistItem(store, user, "missing"), /does not exist/);
    await addWishlistItem(store, user, product.id);
    await addWishlistItem(store, user, product.id);
    const listed = await listWishlist(store, user);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].slug, "kieu");
    await removeWishlistItem(store, user, product.id);
    assert.equal((await listWishlist(store, user)).length, 0);
  } finally {
    await store.close();
    await catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
