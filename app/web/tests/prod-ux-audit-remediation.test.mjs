import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("CSP script-src keeps unsafe-inline without a hash (audit C1)", () => {
  const config = readFileSync(resolve(root, "next.config.ts"), "utf8");
  assert.match(config, /script-src 'self' 'unsafe-inline'/);
  assert.doesNotMatch(config, /script-src[^;]*sha256-/);
  assert.doesNotMatch(config, /THEME_SCRIPT_SHA256/);
});

test("proxy server-gates B2C private pages and HTML-redirects retired supplier", () => {
  const proxy = readFileSync(resolve(root, "src/proxy.ts"), "utf8");
  assert.match(proxy, /requiresAuthPath/);
  assert.match(proxy, /\/account/);
  assert.match(proxy, /\/wishlist/);
  assert.match(proxy, /\/ecom\/orders/);
  assert.match(proxy, /\/gone\/supplier/);
  assert.match(proxy, /text\/html/);
});

test("public catalog categories route is unauthenticated", () => {
  const route = readFileSync(resolve(root, "src/app/api/catalog/categories/route.ts"), "utf8");
  const http = readFileSync(resolve(root, "src/lib/catalog-http.mjs"), "utf8");
  assert.match(route, /handleListPublicCategories/);
  assert.match(http, /handleListPublicCategories/);
  assert.match(http, /listCategories/);
  assert.match(http, /Cache-Control/);
  assert.doesNotMatch(route, /readSession/);
});
