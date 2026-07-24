import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("public catalog routes use the catalog repository without an auth requirement", () => {
  const listRoute = readFileSync(resolve(root, "src/app/api/catalog/products/route.ts"), "utf8");
  const detailRoute = readFileSync(resolve(root, "src/app/api/catalog/products/[slug]/route.ts"), "utf8");
  assert.match(listRoute, /searchPublicProducts/);
  assert.match(detailRoute, /getPublicProduct/);
  assert.doesNotMatch(listRoute, /readSession/);
});

test("vendor offer route reads the signed session before writing an offer", () => {
  const route = readFileSync(resolve(root, "src/app/api/vendor/offers/route.ts"), "utf8");
  assert.match(route, /readSession/);
  assert.match(route, /writeVendorOffer/);
  assert.match(route, /Unauthenticated/);
});
