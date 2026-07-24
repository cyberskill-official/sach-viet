import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createAdminCommerceStore, getAdminCommerceDashboard, listVendorApplications, resolveVendorApplication, submitVendorApplication } from "../src/lib/admin-commerce-core.mjs";
import { createAuthStore, hashPassword } from "../src/lib/auth-core.mjs";
import { createCommerceStore } from "../src/lib/commerce-core.mjs";

function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-admin-commerce-"));
  const dbPath = join(directory, "commerce.sqlite");
  const auth = createAuthStore({ dbPath, log: () => {} });
  const commerce = createCommerceStore({ dbPath, log: () => {} });
  const admin = createAdminCommerceStore({ dbPath, log: () => {}, clock: () => 1000 });
  const addUser = (id, role) => auth.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)").run(id, `${id}@example.test`, hashPassword("correct horse battery staple"), role, 1000);
  try { return run({ auth, commerce, admin, addUser }); } finally { admin.close(); commerce.close(); auth.close(); rmSync(directory, { recursive: true, force: true }); }
}

test("admin dashboard works on a fresh store without prior commerce init", () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-admin-commerce-empty-"));
  const dbPath = join(directory, "commerce.sqlite");
  const auth = createAuthStore({ dbPath, log: () => {} });
  const admin = createAdminCommerceStore({ dbPath, log: () => {}, clock: () => 1000 });
  try {
    auth.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)").run(
      "admin",
      "admin@example.test",
      hashPassword("correct horse battery staple"),
      "admin",
      1000,
    );
    const dashboard = getAdminCommerceDashboard(admin, { id: "admin", role: "admin" });
    assert.equal(dashboard.orderCount, 0);
    assert.equal(dashboard.paidOrderCount, 0);
    assert.equal(dashboard.paidRevenueUsd, "0.0000");
    assert.deepEqual(dashboard.recentOrders, []);
  } finally {
    admin.close();
    auth.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("admin dashboard summarizes paid orders without customer details", () => fixture(({ commerce, admin, addUser }) => {
  addUser("admin", "admin");
  addUser("customer", "customer");
  const insert = commerce.db.prepare("INSERT INTO orders (id, user_id, status, currency, subtotal_usd, created_at, updated_at) VALUES (?, ?, ?, 'USD', ?, ?, ?)");
  insert.run("paid-order", "customer", "paid", "15.5000", 1000, 1000);
  insert.run("pending-order", "customer", "pending_payment", "40.0000", 1001, 1001);
  const dashboard = getAdminCommerceDashboard(admin, { id: "admin", role: "admin" });
  assert.equal(dashboard.orderCount, 2);
  assert.equal(dashboard.paidOrderCount, 1);
  assert.equal(dashboard.paidRevenueUsd, "15.5000");
  assert.equal(Object.hasOwn(dashboard.recentOrders[0], "email"), false);
  assert.throws(() => getAdminCommerceDashboard(admin, { id: "customer", role: "customer" }), /Administrator/);
}));

test("only administrators resolve vendor applications and approval changes the documented role", () => fixture(({ auth, admin, addUser }) => {
  addUser("admin", "admin");
  addUser("customer-a", "customer");
  addUser("customer-b", "customer");
  const first = submitVendorApplication(admin, { id: "customer-a", role: "customer" });
  assert.throws(() => listVendorApplications(admin, { id: "customer-a", role: "customer" }), /Administrator/);
  assert.throws(() => resolveVendorApplication(admin, { id: "admin", role: "admin" }, { applicationId: first.id, decision: "rejected" }), /Rejection reason/);
  assert.equal(resolveVendorApplication(admin, { id: "admin", role: "admin" }, { applicationId: first.id, decision: "rejected", rejectionReason: "Incomplete profile" }).status, "rejected");
  const second = submitVendorApplication(admin, { id: "customer-b", role: "customer" });
  assert.equal(resolveVendorApplication(admin, { id: "admin", role: "admin" }, { applicationId: second.id, decision: "approved" }).status, "approved");
  assert.equal(auth.db.prepare("SELECT role FROM users WHERE id = ?").get("customer-b").role, "vendor");
  assert.throws(() => resolveVendorApplication(admin, { id: "admin", role: "admin" }, { applicationId: second.id, decision: "approved" }), /pending/);
  assert.throws(() => submitVendorApplication(admin, { id: "admin", role: "admin" }), /customers/);
}));
