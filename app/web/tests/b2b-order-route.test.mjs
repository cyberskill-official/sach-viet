import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("B2B order routes use signed sessions and server-side domain operations", () => {
  const staffOrders = readFileSync(resolve(root, "src/app/api/b2b/orders/route.ts"), "utf8");
  const staffOrder = readFileSync(resolve(root, "src/app/api/b2b/orders/[id]/route.ts"), "utf8");
  const institutionOrders = readFileSync(resolve(root, "src/app/api/institution/orders/route.ts"), "utf8");
  const institutionOrder = readFileSync(resolve(root, "src/app/api/institution/orders/[id]/route.ts"), "utf8");
  for (const source of [staffOrders, staffOrder, institutionOrders, institutionOrder]) assert.match(source, /readSession/);
  assert.match(staffOrders, /listStaffOrders/);
  assert.match(staffOrders, /convertWonQuoteToOrder/);
  assert.match(staffOrder, /getStaffOrder/);
  assert.match(staffOrder, /attachArtifact/);
  assert.match(staffOrder, /transitionOrderStatus/);
  assert.match(institutionOrders, /listInstitutionOrders/);
  assert.match(institutionOrder, /getInstitutionOrder/);
});
