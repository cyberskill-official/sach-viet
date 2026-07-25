import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("catalog products route wires optional q through vietnamese search", () => {
  const listRoute = readFileSync(resolve(root, "src/app/api/catalog/products/route.ts"), "utf8");
  assert.match(listRoute, /searchPublicProducts/);
  assert.match(listRoute, /searchParams\.get\("q"\)/);
  assert.doesNotMatch(listRoute, /readSession/);
});

test("suggestions route is public and uses suggestCatalogQueries", () => {
  const route = readFileSync(resolve(root, "src/app/api/catalog/search/suggestions/route.ts"), "utf8");
  assert.match(route, /suggestCatalogQueries/);
  assert.doesNotMatch(route, /readSession/);
});

test("public suggest source never reads raw search_logs", () => {
  const core = readFileSync(resolve(root, "src/lib/vietnamese-search-core.mjs"), "utf8");
  const suggestSource = core.slice(core.indexOf("export function suggestCatalogQueries"));
  assert.ok(suggestSource.length > 0, "suggestCatalogQueries is exported");
  assert.doesNotMatch(suggestSource, /search_logs/);
});
