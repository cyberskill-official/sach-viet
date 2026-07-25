import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createAuthStore, hashPassword } from "../src/lib/auth-core.mjs";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import { createCommerceStore, createPendingOrder } from "../src/lib/commerce-core.mjs";
import { createVendorCommerceStore, createVendorPayout, getVendorDashboard, listAdminPayouts, listVendorIncomingOrders, listVendorPayouts } from "../src/lib/vendor-commerce-core.mjs";

function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-vendor-commerce-"));
  const dbPath = join(directory, "commerce.sqlite");
  const auth = createAuthStore({ dbPath, log: () => {} });
  const catalog = createCatalogStore({ dbPath, log: () => {} });
  const commerce = createCommerceStore({ dbPath, log: () => {} });
  const vendorStore = createVendorCommerceStore({ dbPath, log: () => {}, clock: () => 2000 });
  const addUser = (id, role) => auth.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)").run(id, `${id}@example.test`, hashPassword("correct horse battery staple"), role, 1000);
  try { return run({ auth, catalog, commerce, vendorStore, addUser }); }
  finally { vendorStore.close(); commerce.close(); catalog.close(); auth.close(); rmSync(directory, { recursive: true, force: true }); }
}

function seedOrders({ catalog, commerce, addUser }) {
  addUser("admin", "admin");
  addUser("vendor-a", "vendor");
  addUser("vendor-b", "vendor");
  addUser("customer", "customer");
  createCategory(catalog, { slug: "books", name: "Books" });
  const product = createProduct(catalog, { categorySlug: "books", slug: "book", title: "Book", description: "A book" });
  const offerA = writeVendorOffer(catalog, { id: "vendor-a", role: "vendor" }, { productId: product.id, vendorId: "vendor-a", priceUsd: "10.00", stockQuantity: 5 });
  const offerB = writeVendorOffer(catalog, { id: "vendor-b", role: "vendor" }, { productId: product.id, vendorId: "vendor-b", priceUsd: "12.00", stockQuantity: 5 });
  createPendingOrder(commerce, { id: "customer", role: "customer" }, [{ vendorOfferId: offerA.id, quantity: 2 }, { vendorOfferId: offerB.id, quantity: 1 }]);
  const order = commerce.db.prepare("SELECT id FROM orders LIMIT 1").get();
  commerce.db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order.id);
  const items = commerce.db.prepare("SELECT id, vendor_offer_id AS vendorOfferId FROM order_items ORDER BY vendor_offer_id").all();
  return { offerA, offerB, items, orderId: order.id };
}

test("vendors read only their incoming order lines and dashboard totals", () => fixture((stores) => {
  const { items } = seedOrders(stores);
  const orders = listVendorIncomingOrders(stores.vendorStore, { id: "vendor-a", role: "vendor" });
  assert.equal(orders.length, 1);
  assert.equal(orders[0].quantity, 2);
  assert.equal(Object.hasOwn(orders[0], "email"), false);
  assert.throws(() => listVendorIncomingOrders(stores.vendorStore, { id: "vendor-a", role: "vendor" }, { vendorId: "vendor-b" }), /another vendor/);
  assert.throws(() => listVendorIncomingOrders(stores.vendorStore, { id: "customer", role: "customer" }), /Vendor access/);
  const dashboard = getVendorDashboard(stores.vendorStore, { id: "vendor-a", role: "vendor" });
  assert.equal(dashboard.incomingOrderLineCount, 1);
  assert.equal(dashboard.paidOrderLineCount, 1);
  assert.equal(dashboard.paidLineTotalUsd, "20.0000");
  assert.equal(dashboard.payoutCount, 0);
  assert.ok(items.some((item) => item.vendorOfferId));
}));

test("administrators create payouts with explicit amounts and vendors read only their history", () => fixture((stores) => {
  const { items, offerA } = seedOrders(stores);
  const vendorAItem = items.find((item) => item.vendorOfferId === offerA.id);
  const foreign = items.find((item) => item.vendorOfferId !== offerA.id);
  assert.throws(() => createVendorPayout(stores.vendorStore, { id: "vendor-a", role: "vendor" }, { vendorId: "vendor-a", amountUsd: "15.00", orderItemIds: [vendorAItem.id] }), /Administrator/);
  assert.throws(() => createVendorPayout(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a", amountUsd: "15.00", orderItemIds: [foreign.id] }), /belong to this vendor/);
  assert.throws(() => createVendorPayout(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a", orderItemIds: [vendorAItem.id] }), /Money must/);
  const payout = createVendorPayout(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a", amountUsd: "15", orderItemIds: [vendorAItem.id] });
  assert.equal(payout.amountUsd, "15.0000");
  assert.throws(() => createVendorPayout(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a", amountUsd: "1.00", orderItemIds: [vendorAItem.id] }), /already included/);
  const history = listVendorPayouts(stores.vendorStore, { id: "vendor-a", role: "vendor" });
  assert.equal(history.length, 1);
  assert.deepEqual(history[0].orderItemIds, [vendorAItem.id]);
  assert.throws(() => listVendorPayouts(stores.vendorStore, { id: "vendor-b", role: "vendor" }, { vendorId: "vendor-a" }), /another vendor/);
  const adminView = listVendorPayouts(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a" });
  assert.equal(adminView.length, 1);
  assert.equal(listAdminPayouts(stores.vendorStore, { id: "admin", role: "admin" })[0].vendorId, "vendor-a");
  assert.throws(() => listAdminPayouts(stores.vendorStore, { id: "vendor-a", role: "vendor" }), /Administrator/);
  const dashboard = getVendorDashboard(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a" });
  assert.equal(dashboard.payoutCount, 1);
  assert.equal(dashboard.payoutTotalUsd, "15.0000");
}));
