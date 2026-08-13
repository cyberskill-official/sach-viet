import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("vendor commerce routes use signed sessions and server-side repository calls", async () => {
  const orders = readFileSync(resolve(root, "src/app/api/vendor/orders/route.ts"), "utf8");
  const payouts = readFileSync(resolve(root, "src/app/api/vendor/payouts/route.ts"), "utf8");
  const dashboard = readFileSync(resolve(root, "src/app/api/vendor/dashboard/route.ts"), "utf8");
  const adminPayouts = readFileSync(resolve(root, "src/app/api/admin/payouts/route.ts"), "utf8");
  for (const source of [orders, payouts, dashboard, adminPayouts]) assert.match(source, /readSession/);
  assert.match(orders, /listVendorIncomingOrders/);
  assert.match(payouts, /listVendorPayouts/);
  assert.match(dashboard, /getVendorDashboard/);
  assert.match(adminPayouts, /createVendorPayout/);
  assert.match(adminPayouts, /listAdminPayouts/);
});
