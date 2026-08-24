import assert from "node:assert/strict";
import test from "node:test";
import {
  assertCatalogParity,
  DEFAULT_LOCALE,
  normalizeLocale,
  resolveLocale,
  translate,
} from "../src/lib/i18n/index.mjs";
import { normalizeLocale as foundationsNormalize, translate as foundationsTranslate } from "../src/lib/web-foundations.mjs";

test("normalizeLocale defaults to English", () => {
  assert.equal(DEFAULT_LOCALE, "en");
  assert.equal(normalizeLocale("en"), "en");
  assert.equal(normalizeLocale("vi"), "vi");
  assert.equal(normalizeLocale("fr"), "en");
  assert.equal(normalizeLocale(undefined), "en");
  assert.equal(foundationsNormalize("zz"), "en");
});

test("resolveLocale prefers query then cookie/storage then user then en", () => {
  assert.equal(resolveLocale({ queryLang: "vi", cookieLocale: "en", userLocale: "en" }), "vi");
  assert.equal(resolveLocale({ cookieLocale: "vi", storageLocale: "en", userLocale: "en" }), "vi");
  assert.equal(resolveLocale({ storageLocale: "vi", userLocale: "en" }), "vi");
  assert.equal(resolveLocale({ userLocale: "vi" }), "vi");
  assert.equal(resolveLocale({}), "en");
});

test("EN and VI catalogs have key parity", () => {
  const parity = assertCatalogParity();
  assert.deepEqual(parity.missingInVi, []);
  assert.deepEqual(parity.missingInEn, []);
  assert.equal(parity.ok, true);
});

test("translate resolves nested and legacy flat keys", () => {
  assert.equal(translate("en", "storefront.heroTitle"), "Literature, considered with care");
  assert.equal(translate("vi", "storefront.heroTitle"), "Văn học, được chọn lọa tỉ mỉ");
  assert.equal(translate("en", "empty"), "No data available");
  assert.equal(foundationsTranslate("en", "navigation"), "Navigation");
  assert.equal(translate("en", "storefront.inStock", { count: 3 }), "In stock: 3");
});
