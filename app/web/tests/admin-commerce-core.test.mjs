import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createAdminCommerceStore, getAdminCommerceDashboard, listVendorApplications, resolveVendorApplication, submitVendorApplication } from "../src/lib/admin-commerce-core.mjs";
import { createAuthStore, hashPassword } from "../src/lib/auth-core.mjs";
import { createCommerceStore } from "../src/lib/commerce-core.mjs";

async function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-admin-commerce-"));
  const dbPath = join(directory, "commerce.sqlite");
  const auth = await createAuthStore({ dbPath, log: () => {} });
  const commerce = await createCommerceStore({ dbPath, log: () => {} });
  const admin = await createAdminCommerceStore({ dbPath, log: () => {}, clock: () => 1000 });
  const addUser = async (id, role) => auth.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)").run(id, `${id}@example.test`, hashPassword("correct horse battery staple"), role, 1000);
  try { return await run({ auth, commerce, admin, addUser }); } finally { await admin.close(); await commerce.close(); await auth.close(); rmSync(directory, { recursive: true, force: true }); }
}

test("admin dashboard works on a fresh store without prior commerce init", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-admin-commerce-empty-"));
  const dbPath = join(directory, "commerce.sqlite");
  const auth = await createAuthStore({ dbPath, log: () => {} });
  const admin = await createAdminCommerceStore({ dbPath, log: () => {}, clock: () => 1000 });
  try {
    await auth.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)").run(
      "admin",
      "admin@example.test",
      hashPassword("correct horse battery staple"),
      "admin",
      1000,
    );
    const dashboard = await getAdminCommerceDashboard(admin, { id: "admin", role: "admin" });
    assert.equal(dashboard.orderCount, 0);
    assert.equal(dashboard.paidOrderCount, 0);
    assert.equal(dashboard.paidRevenueUsd, "0.0000");
    assert.deepEqual(dashboard.recentOrders, []);
  } finally {
    await admin.close();
    await auth.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("admin dashboard summarizes paid orders without customer details", async () => fixture(async ({ commerce, admin, addUser }) => {
  await addUser("admin", "admin");
  await addUser("customer", "customer");
  const insert = commerce.db.prepare("INSERT INTO orders (id, user_id, status, currency, subtotal_usd, created_at, updated_at) VALUES (?, ?, ?, 'USD', ?, ?, ?)");
  await insert.run("paid-order", "customer", "paid", "15.5000", 1000, 1000);
  await insert.run("pending-order", "customer", "pending_payment", "40.0000", 1001, 1001);
  const dashboard = await getAdminCommerceDashboard(admin, { id: "admin", role: "admin" });
  assert.equal(dashboard.orderCount, 2);
  assert.equal(dashboard.paidOrderCount, 1);
  assert.equal(dashboard.paidRevenueUsd, "15.5000");
  assert.equal(Object.hasOwn(dashboard.recentOrders[0], "email"), false);
  await assert.rejects(async () => await getAdminCommerceDashboard(admin, { id: "customer", role: "customer" }), /Administrator/);
}));

test("only administrators resolve vendor applications and approval changes the documented role", async () => fixture(async ({ auth, admin, addUser }) => {
  await addUser("admin", "admin");
  await addUser("customer-a", "customer");
  await addUser("customer-b", "customer");
  const first = await submitVendorApplication(admin, { id: "customer-a", role: "customer" });
  await assert.rejects(async () => await listVendorApplications(admin, { id: "customer-a", role: "customer" }), /Administrator/);
  await assert.rejects(async () => await resolveVendorApplication(admin, { id: "admin", role: "admin" }, { applicationId: first.id, decision: "rejected" }), /Rejection reason/);
  assert.equal((await resolveVendorApplication(admin, { id: "admin", role: "admin" }, { applicationId: first.id, decision: "rejected", rejectionReason: "Incomplete profile" })).status, "rejected");
  const second = await submitVendorApplication(admin, { id: "customer-b", role: "customer" });
  assert.equal((await resolveVendorApplication(admin, { id: "admin", role: "admin" }, { applicationId: second.id, decision: "approved" })).status, "approved");
  assert.equal((await auth.db.prepare("SELECT role FROM users WHERE id = ?").get("customer-b")).role, "vendor");
  await assert.rejects(async () => await resolveVendorApplication(admin, { id: "admin", role: "admin" }, { applicationId: second.id, decision: "approved" }), /pending/);
  await assert.rejects(async () => await submitVendorApplication(admin, { id: "admin", role: "admin" }), /customers/);
}));
