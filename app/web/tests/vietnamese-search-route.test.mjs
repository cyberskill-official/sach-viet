import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("catalog products route wires optional q through vietnamese search", async () => {
  const listHttp = readFileSync(resolve(root, "src/lib/catalog-http.mjs"), "utf8");
  assert.match(listHttp, /searchPublicProducts/);
  assert.match(listHttp, /searchParams\.get\("q"\)/);
  assert.doesNotMatch(listHttp, /readSession/);
});

test("suggestions route is public and uses suggestCatalogQueries", async () => {
  const http = readFileSync(resolve(root, "src/lib/catalog-http.mjs"), "utf8");
  const route = readFileSync(resolve(root, "src/app/api/catalog/search/suggestions/route.ts"), "utf8");
  assert.match(http, /suggestCatalogQueries/);
  assert.match(route, /handleSuggestCatalogQueries/);
  assert.doesNotMatch(route, /readSession/);
});

test("public suggest source never reads raw search_logs", async () => {
  const core = readFileSync(resolve(root, "src/lib/vietnamese-search-core.mjs"), "utf8");
  const suggestSource = core.slice(core.indexOf("export function suggestCatalogQueries"));
  assert.ok(suggestSource.length > 0, "suggestCatalogQueries is exported");
  assert.doesNotMatch(suggestSource, /search_logs/);
});
