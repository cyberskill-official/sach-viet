import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createAdminCommerceStore, submitVendorApplication } from "../src/lib/admin-commerce-core.mjs";
import { createAuthStore, hashPassword } from "../src/lib/auth-core.mjs";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import { createCommerceStore, createPendingOrder } from "../src/lib/commerce-core.mjs";
import {
  createEmployeeRetailStore,
  getEmployeeDashboard,
  listHomeSections,
  listRetailOrders,
  setRetailOrderItemFulfillment,
  upsertHomeSection,
} from "../src/lib/employee-retail-core.mjs";
import { createSupportStore, createTicket, createGoodsRequest } from "../src/lib/support-core.mjs";

async function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-employee-retail-"));
  const dbPath = join(directory, "ops.sqlite");
  const auth = await createAuthStore({ dbPath, log: () => {} });
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const commerce = await createCommerceStore({ dbPath, log: () => {} });
  const support = await createSupportStore({ dbPath, log: () => {} });
  const admin = await createAdminCommerceStore({ dbPath, log: () => {} });
  const ops = await createEmployeeRetailStore({ dbPath, log: () => {}, clock: () => 3000 });
  const addUser = async (id, role) =>
    await auth.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)").run(
      id,
      `${id}@example.test`,
      hashPassword("correct horse battery staple"),
      role,
      1000,
    );
  try {
    return await run({ auth, catalog, commerce, support, admin, ops, addUser });
  } finally {
    await ops.close();
    await admin.close();
    await support.close();
    await commerce.close();
    await catalog.close();
    await auth.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

async function seedCommerce({ catalog, commerce, support, admin, addUser }) {
  await addUser("admin", "admin");
  await addUser("employee", "employee");
  await addUser("retailer", "employee_b2c");
  await addUser("b2b", "employee_b2b");
  await addUser("vendor", "vendor");
  await addUser("customer", "customer");
  await addUser("applicant", "customer");
  await createCategory(catalog, { slug: "books", name: "Books" });
  const product = await createProduct(catalog, { categorySlug: "books", slug: "book", title: "Book", description: "A book" });
  const offer = await writeVendorOffer(catalog, { id: "vendor", role: "vendor" }, { productId: product.id, vendorId: "vendor", priceUsd: "10.00", stockQuantity: 5 });
  await createPendingOrder(commerce, { id: "customer", role: "customer" }, [{ vendorOfferId: offer.id, quantity: 1 }]);
  const order = await commerce.db.prepare("SELECT id FROM orders LIMIT 1").get();
  await commerce.db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order.id);
  await createTicket(support, { id: "customer", role: "customer" }, { subject: "Help" });
  await createGoodsRequest(support, { id: "customer", role: "customer" }, { details: "Find this title" });
  await submitVendorApplication(admin, { id: "applicant", role: "customer" });
  return { orderId: order.id };
}

test("employee dashboard derives counts and approval queue without customer secrets", async () =>
  fixture(async (stores) => {
    await seedCommerce(stores);
    const dashboard = await getEmployeeDashboard(stores.ops, { id: "employee", role: "employee" });
    assert.equal(dashboard.orderCount, 1);
    assert.equal(dashboard.paidOrderCount, 1);
    assert.equal(dashboard.openTicketCount, 1);
    assert.equal(dashboard.openGoodsRequestCount, 1);
    assert.equal(dashboard.pendingVendorApplicationCount, 1);
    assert.equal(dashboard.approvalQueue.length, 1);
    assert.equal(Object.hasOwn(dashboard.approvalQueue[0], "email"), false);
    await assert.rejects(async () => await getEmployeeDashboard(stores.ops, { id: "customer", role: "customer" }), /Employee access/);
    await assert.rejects(async () => await getEmployeeDashboard(stores.ops, { id: "vendor", role: "vendor" }), /Employee access/);
  }));

test("employee and admin persist home sections while unauthorized roles cannot", async () =>
  fixture(async (stores) => {
    await seedCommerce(stores);
    await assert.rejects(async () => await upsertHomeSection(stores.ops, { id: "customer", role: "customer" }, { sectionKey: "hero", title: "Hero" }),
      /Employee access/,
    );
    await assert.rejects(async () => await upsertHomeSection(stores.ops, { id: "employee", role: "employee" }, { sectionKey: "Hero!", title: "Hero" }),
      /snake_case/,
    );
    const created = await upsertHomeSection(stores.ops, { id: "employee", role: "employee" }, {
      sectionKey: "hero",
      title: "Hero",
      body: "Welcome",
      sortOrder: 1,
      isEnabled: true,
    });
    assert.equal(created.sectionKey, "hero");
    assert.equal(created.isEnabled, true);
    const updated = await upsertHomeSection(stores.ops, { id: "admin", role: "admin" }, {
      sectionKey: "hero",
      title: "Hero updated",
      body: "Updated",
      sortOrder: 2,
      isEnabled: false,
    });
    assert.equal(updated.title, "Hero updated");
    assert.equal(updated.isEnabled, false);
    const sections = await listHomeSections(stores.ops, { id: "b2b", role: "employee_b2b" });
    assert.equal(sections.length, 1);
    assert.equal(sections[0].title, "Hero updated");
  }));

test("retail roles list orders without email or payment secrets and non-retail roles are rejected", async () =>
  fixture(async (stores) => {
    await seedCommerce(stores);
    const orders = await listRetailOrders(stores.ops, { id: "retailer", role: "employee_b2c" });
    assert.equal(orders.items.length, 1);
    assert.equal(orders.items[0].status, "paid");
    assert.equal(Object.hasOwn(orders.items[0], "email"), false);
    assert.equal(Object.hasOwn(orders.items[0], "stripe_session_id"), false);
    assert.equal(Object.hasOwn(orders.items[0], "checkout_url"), false);
    const lineId = orders.items[0].items[0].id;
    const overlay = await setRetailOrderItemFulfillment(stores.ops, { id: "retailer", role: "employee_b2c" }, {
      orderItemId: lineId,
      fulfillmentStatus: "delivered",
    });
    assert.equal(overlay.fulfillmentStatus, "delivered");
    const adminOrders = await listRetailOrders(stores.ops, { id: "admin", role: "admin" });
    assert.equal(adminOrders.items.length, 1);
    await assert.rejects(async () => await listRetailOrders(stores.ops, { id: "employee", role: "employee" }), /Retail access/);
    await assert.rejects(async () => await listRetailOrders(stores.ops, { id: "b2b", role: "employee_b2b" }), /Retail access/);
    await assert.rejects(async () => await listRetailOrders(stores.ops, { id: "customer", role: "customer" }), /Retail access/);
  }));

test("home-config validation and empty-store dashboard paths stay safe", async () =>
  fixture(async (stores) => {
    await stores.addUser("employee", "employee");
    await stores.addUser("retailer", "employee_b2c");
    await assert.rejects(async () => await getEmployeeDashboard(stores.ops, null), /Authentication/);
    await assert.rejects(async () => await listRetailOrders(stores.ops, {}), /Authentication/);
    const empty = await getEmployeeDashboard(stores.ops, { id: "employee", role: "employee" });
    assert.equal(empty.orderCount, 0);
    assert.equal(empty.pendingVendorApplicationCount, 0);
    assert.deepEqual(empty.approvalQueue, []);
    await assert.rejects(async () => await upsertHomeSection(stores.ops, { id: "employee", role: "employee" }, { sectionKey: "hero", title: "Hero", body: "x".repeat(4001) }),
      /too long/,
    );
    const section = await upsertHomeSection(stores.ops, { id: "employee", role: "employee" }, { sectionKey: "promo", title: "Promo" });
    assert.equal(section.sortOrder, 0);
    assert.equal(section.isEnabled, true);
    assert.equal((await listRetailOrders(stores.ops, { id: "retailer", role: "employee_b2c" })).items.length, 0);
  }));
