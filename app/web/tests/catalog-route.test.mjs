import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("public catalog routes use the catalog repository without an auth requirement", async () => {
  const listHttp = readFileSync(resolve(root, "src/lib/catalog-http.mjs"), "utf8");
  const listRoute = readFileSync(resolve(root, "src/app/api/catalog/products/route.ts"), "utf8");
  const categoriesRoute = readFileSync(resolve(root, "src/app/api/catalog/categories/route.ts"), "utf8");
  const detailRoute = readFileSync(resolve(root, "src/app/api/catalog/products/[slug]/route.ts"), "utf8");
  assert.match(listHttp, /searchPublicProducts/);
  assert.match(listRoute, /handleListPublicProducts/);
  assert.match(categoriesRoute, /handleListPublicCategories/);
  assert.match(detailRoute, /getPublicProduct/);
  assert.doesNotMatch(listRoute, /readSession/);
  assert.doesNotMatch(categoriesRoute, /readSession/);
  assert.doesNotMatch(listHttp, /readSession/);
});

test("vendor offer route reads the signed session before writing an offer", async () => {
  const route = readFileSync(resolve(root, "src/app/api/vendor/offers/route.ts"), "utf8");
  assert.match(route, /readSession/);
  assert.match(route, /writeVendorOffer/);
  assert.match(route, /Unauthenticated/);
});
