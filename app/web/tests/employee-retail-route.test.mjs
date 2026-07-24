import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("employee and retail routes use signed sessions and server-side repository calls", () => {
  const dashboard = readFileSync(resolve(root, "src/app/api/employee/dashboard/route.ts"), "utf8");
  const homeSections = readFileSync(resolve(root, "src/app/api/employee/home-sections/route.ts"), "utf8");
  const retailOrders = readFileSync(resolve(root, "src/app/api/retail/orders/route.ts"), "utf8");
  for (const source of [dashboard, homeSections, retailOrders]) assert.match(source, /readSession/);
  assert.match(dashboard, /getEmployeeDashboard/);
  assert.match(homeSections, /listHomeSections/);
  assert.match(homeSections, /upsertHomeSection/);
  assert.match(retailOrders, /listRetailOrders/);
});
