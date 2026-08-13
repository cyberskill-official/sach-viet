import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createAuthStore, hashPassword } from "../src/lib/auth-core.mjs";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import { createCommerceStore, createPendingOrder } from "../src/lib/commerce-core.mjs";
import { createVendorCommerceStore, createVendorPayout, getVendorDashboard, listAdminPayouts, listVendorIncomingOrders, listVendorPayouts } from "../src/lib/vendor-commerce-core.mjs";

async function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-vendor-commerce-"));
  const dbPath = join(directory, "commerce.sqlite");
  const auth = await createAuthStore({ dbPath, log: () => {} });
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const commerce = await createCommerceStore({ dbPath, log: () => {} });
  const vendorStore = await createVendorCommerceStore({ dbPath, log: () => {}, clock: () => 2000 });
  const addUser = async (id, role) => auth.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)").run(id, `${id}@example.test`, hashPassword("correct horse battery staple"), role, 1000);
  try { return await run({ auth, catalog, commerce, vendorStore, addUser }); }
  finally { await vendorStore.close(); await commerce.close(); await catalog.close(); await auth.close(); rmSync(directory, { recursive: true, force: true }); }
}

async function seedOrders({ catalog, commerce, addUser }) {
  await addUser("admin", "admin");
  await addUser("vendor-a", "vendor");
  await addUser("vendor-b", "vendor");
  await addUser("customer", "customer");
  await createCategory(catalog, { slug: "books", name: "Books" });
  const product = await createProduct(catalog, { categorySlug: "books", slug: "book", title: "Book", description: "A book" });
  const offerA = await writeVendorOffer(catalog, { id: "vendor-a", role: "vendor" }, { productId: product.id, vendorId: "vendor-a", priceUsd: "10.00", stockQuantity: 5 });
  const offerB = await writeVendorOffer(catalog, { id: "vendor-b", role: "vendor" }, { productId: product.id, vendorId: "vendor-b", priceUsd: "12.00", stockQuantity: 5 });
  await createPendingOrder(commerce, { id: "customer", role: "customer" }, [{ vendorOfferId: offerA.id, quantity: 2 }, { vendorOfferId: offerB.id, quantity: 1 }]);
  const order = await commerce.db.prepare("SELECT id FROM orders LIMIT 1").get();
  await commerce.db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order.id);
  const items = await commerce.db.prepare("SELECT id, vendor_offer_id AS vendorOfferId FROM order_items ORDER BY vendor_offer_id").all();
  return { offerA, offerB, items, orderId: order.id };
}

test("vendors read only their incoming order lines and dashboard totals", async () => fixture(async (stores) => {
  const { items } = await seedOrders(stores);
  const orders = await listVendorIncomingOrders(stores.vendorStore, { id: "vendor-a", role: "vendor" });
  assert.equal(orders.length, 1);
  assert.equal(orders[0].quantity, 2);
  assert.equal(Object.hasOwn(orders[0], "email"), false);
  await assert.rejects(async () => await listVendorIncomingOrders(stores.vendorStore, { id: "vendor-a", role: "vendor" }, { vendorId: "vendor-b" }), /another vendor/);
  await assert.rejects(async () => await listVendorIncomingOrders(stores.vendorStore, { id: "customer", role: "customer" }), /Vendor access/);
  const dashboard = await getVendorDashboard(stores.vendorStore, { id: "vendor-a", role: "vendor" });
  assert.equal(dashboard.incomingOrderLineCount, 1);
  assert.equal(dashboard.paidOrderLineCount, 1);
  assert.equal(dashboard.paidLineTotalUsd, "20.0000");
  assert.equal(dashboard.payoutCount, 0);
  assert.ok(items.some((item) => item.vendorOfferId));
}));

test("administrators create payouts with explicit amounts and vendors read only their history", async () => fixture(async (stores) => {
  const { items, offerA } = await seedOrders(stores);
  const vendorAItem = items.find((item) => item.vendorOfferId === offerA.id);
  const foreign = items.find((item) => item.vendorOfferId !== offerA.id);
  await assert.rejects(async () => await createVendorPayout(stores.vendorStore, { id: "vendor-a", role: "vendor" }, { vendorId: "vendor-a", amountUsd: "15.00", orderItemIds: [vendorAItem.id] }), /Administrator/);
  await assert.rejects(async () => await createVendorPayout(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a", amountUsd: "15.00", orderItemIds: [foreign.id] }), /belong to this vendor/);
  await assert.rejects(async () => await createVendorPayout(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a", orderItemIds: [vendorAItem.id] }), /Money must/);
  const payout = await createVendorPayout(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a", amountUsd: "15", orderItemIds: [vendorAItem.id] });
  assert.equal(payout.amountUsd, "15.0000");
  await assert.rejects(async () => await createVendorPayout(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a", amountUsd: "1.00", orderItemIds: [vendorAItem.id] }), /already included/);
  const history = await listVendorPayouts(stores.vendorStore, { id: "vendor-a", role: "vendor" });
  assert.equal(history.length, 1);
  assert.deepEqual(history[0].orderItemIds, [vendorAItem.id]);
  await assert.rejects(async () => await listVendorPayouts(stores.vendorStore, { id: "vendor-b", role: "vendor" }, { vendorId: "vendor-a" }), /another vendor/);
  const adminView = await listVendorPayouts(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a" });
  assert.equal(adminView.length, 1);
  assert.equal((await listAdminPayouts(stores.vendorStore, { id: "admin", role: "admin" }))[0].vendorId, "vendor-a");
  await assert.rejects(async () => await listAdminPayouts(stores.vendorStore, { id: "vendor-a", role: "vendor" }), /Administrator/);
  const dashboard = await getVendorDashboard(stores.vendorStore, { id: "admin", role: "admin" }, { vendorId: "vendor-a" });
  assert.equal(dashboard.payoutCount, 1);
  assert.equal(dashboard.payoutTotalUsd, "15.0000");
}));
