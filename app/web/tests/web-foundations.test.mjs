import assert from "node:assert/strict";
import test from "node:test";
import { getPortal, mayAccessPortal, normalizeLocale, normalizeTheme, translate } from "../src/lib/web-foundations.mjs";

test("locales fall back to Vietnamese and retain missing keys", () => {
  assert.equal(normalizeLocale("en"), "en");
  assert.equal(normalizeLocale("fr"), "vi");
  assert.equal(translate("en", "empty"), "No data available");
  assert.equal(translate("vi", "unknown"), "unknown");
});

test("themes use only documented values", () => {
  assert.equal(normalizeTheme("dark"), "dark");
  assert.equal(normalizeTheme("glass"), "glass");
  assert.equal(normalizeTheme("unknown"), "light");
});

test("portal configuration distinguishes public and protected access", () => {
  assert.equal(getPortal("missing"), null);
  assert.equal(mayAccessPortal(null, "ecom"), true);
  assert.equal(mayAccessPortal(null, "vendor"), false);
  assert.equal(mayAccessPortal({ role: "vendor" }, "vendor"), true);
  assert.equal(mayAccessPortal({ role: "vendor" }, "admin"), false);
  assert.equal(mayAccessPortal({ role: "super_admin" }, "b2b"), true);
});
