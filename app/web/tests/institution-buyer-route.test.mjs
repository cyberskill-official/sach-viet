import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("institution buyer routes use signed sessions and domain operations", async () => {
  const budget = readFileSync(resolve(root, "src/app/api/institution/budget/route.ts"), "utf8");
  const purchaseOrder = readFileSync(resolve(root, "src/app/api/institution/orders/[id]/purchase-order/route.ts"), "utf8");
  const marcList = readFileSync(resolve(root, "src/app/api/institution/marc/route.ts"), "utf8");
  const marcDetail = readFileSync(resolve(root, "src/app/api/institution/marc/[productId]/route.ts"), "utf8");
  const staffMarc = readFileSync(resolve(root, "src/app/api/b2b/marc/route.ts"), "utf8");
  for (const source of [budget, purchaseOrder, marcList, marcDetail, staffMarc]) assert.match(source, /readSession/);
  assert.match(budget, /getInstitutionBudget/);
  assert.match(budget, /upsertInstitutionBudget/);
  assert.match(purchaseOrder, /submitInstitutionPurchaseOrder/);
  assert.match(marcList, /listInstitutionMarcRecords/);
  assert.match(marcDetail, /getInstitutionMarcRecord/);
  assert.match(staffMarc, /registerInstitutionMarcRecord/);
});

test("existing institution blind-read handlers remain intact", async () => {
  const quotes = readFileSync(resolve(root, "src/app/api/institution/quotes/route.ts"), "utf8");
  const quote = readFileSync(resolve(root, "src/app/api/institution/quotes/[id]/route.ts"), "utf8");
  const orders = readFileSync(resolve(root, "src/app/api/institution/orders/route.ts"), "utf8");
  const order = readFileSync(resolve(root, "src/app/api/institution/orders/[id]/route.ts"), "utf8");
  assert.match(quotes, /listInstitutionQuotes/);
  assert.match(quote, /getInstitutionQuote/);
  assert.match(orders, /listInstitutionOrders/);
  assert.match(order, /getInstitutionOrder/);
  assert.doesNotMatch(order, /submitInstitutionPurchaseOrder/);
});
