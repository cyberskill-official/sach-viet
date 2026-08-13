import { openDatabase } from "./db.mjs";

function requiredUser(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  return user;
}

export async function createWishlistStore({ dbPath, clock = () => Date.now(), log = () => {} } = {}) {
  const db = await openDatabase(dbPath);
  return { db, clock, log, close: () => db.close() };
}

export async function listWishlist(store, user) {
  requiredUser(user);
  return await store.db
    .prepare(
      `SELECT products.id, products.slug, products.title, wishlists.created_at AS "createdAt"
       FROM wishlists
       JOIN products ON products.id = wishlists.product_id
       WHERE wishlists.user_id = ?
       ORDER BY wishlists.created_at DESC, products.id DESC`,
    )
    .all(user.id);
}

export async function addWishlistItem(store, user, productId) {
  requiredUser(user);
  if (typeof productId !== "string" || productId.trim() === "") throw new Error("Product ID is required.");
  const product = await store.db.prepare("SELECT id FROM products WHERE id = ?").get(productId.trim());
  if (!product) throw new Error("Product does not exist.");
  await store.db
    .prepare("INSERT INTO wishlists (user_id, product_id, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING")
    .run(user.id, product.id, store.clock());
  store.log?.("wishlist_item_added", { result: "accepted", product_id: product.id });
  return { productId: product.id };
}

export async function removeWishlistItem(store, user, productId) {
  requiredUser(user);
  if (typeof productId !== "string" || productId.trim() === "") throw new Error("Product ID is required.");
  await store.db.prepare("DELETE FROM wishlists WHERE user_id = ? AND product_id = ?").run(user.id, productId.trim());
  store.log?.("wishlist_item_removed", { result: "accepted", product_id: productId.trim() });
  return { removed: true };
}
