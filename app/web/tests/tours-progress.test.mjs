import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyTourProgress,
  mergeTourProgress,
  normalizeProgressMap,
} from "../src/lib/tours/progress.mjs";
import {
  TOUR_IDS,
  PORTAL_TOUR_ROLES,
  getTourDefinition,
  joyrideStepsFor,
  listPortalTourIds,
  resolveTourIdForPath,
  shouldAutoStartTour,
  tourIdForPortal,
  tourTitleKey,
} from "../src/lib/tours/registry.mjs";
import { assertCatalogParity, translate } from "../src/lib/i18n/index.mjs";

test("tour registry covers required B2C and shared flows", () => {
  for (const id of [
    "tour.storefront",
    "tour.product_cart",
    "tour.orders",
    "tour.account",
    "tour.wishlist",
    "tour.support",
    "tour.features",
    "tour.auth",
    "tour.portal_overview",
  ]) {
    assert.ok(TOUR_IDS.includes(id), id);
    assert.ok(getTourDefinition(id)?.steps?.length >= 1, id);
  }
});

test("every role portal has a dedicated tour id", () => {
  assert.deepEqual(PORTAL_TOUR_ROLES, [
    "admin",
    "vendor",
    "employee",
    "retail",
    "b2b",
    "institution",
    "publisher",
    "author",
    "supplier",
  ]);
  for (const role of PORTAL_TOUR_ROLES) {
    const id = tourIdForPortal(role);
    assert.equal(id, `tour.portal_${role}`);
    assert.ok(TOUR_IDS.includes(id), id);
    assert.ok(getTourDefinition(id)?.steps?.length >= 1, id);
  }
  assert.deepEqual(listPortalTourIds(), PORTAL_TOUR_ROLES.map((role) => `tour.portal_${role}`));
});

test("resolveTourIdForPath maps major surfaces", () => {
  assert.equal(resolveTourIdForPath("/"), "tour.storefront");
  assert.equal(resolveTourIdForPath("/products/abc"), "tour.product_cart");
  assert.equal(resolveTourIdForPath("/ecom/cart"), "tour.product_cart");
  assert.equal(resolveTourIdForPath("/ecom/orders"), "tour.orders");
  assert.equal(resolveTourIdForPath("/wishlist"), "tour.wishlist");
  assert.equal(resolveTourIdForPath("/support"), "tour.support");
  assert.equal(resolveTourIdForPath("/features"), "tour.features");
  assert.equal(resolveTourIdForPath("/login"), "tour.auth");
  assert.equal(resolveTourIdForPath("/vendor"), "tour.portal_vendor");
  assert.equal(resolveTourIdForPath("/admin"), "tour.portal_admin");
  assert.equal(resolveTourIdForPath("/supplier"), "tour.portal_supplier");
});

test("auth tour does not auto-start", () => {
  assert.equal(shouldAutoStartTour("tour.auth"), false);
  assert.equal(shouldAutoStartTour("tour.storefront"), true);
  assert.equal(shouldAutoStartTour("tour.portal_vendor"), true);
});

test("joyride steps localize content and use data-tour targets", () => {
  const en = joyrideStepsFor("tour.storefront", "en", { onlyPresent: false });
  const vi = joyrideStepsFor("tour.storefront", "vi", { onlyPresent: false });
  assert.ok(en[0].content.includes("Welcome") || en[0].content.includes("Sách"));
  assert.notEqual(en[0].content, vi[0].content);
  assert.ok(en[0].target.startsWith("[data-tour="));
});

test("tour title keys resolve in both catalogs", () => {
  for (const id of TOUR_IDS) {
    const key = tourTitleKey(id);
    const en = translate("en", key);
    const vi = translate("vi", key);
    assert.notEqual(en, key, key);
    assert.notEqual(vi, key, key);
  }
  assert.ok(assertCatalogParity().ok);
});

test("mergeTourProgress prefers newer updatedAt and terminal status", () => {
  const local = normalizeProgressMap({
    "tour.storefront": { status: "dismissed", updatedAt: 100 },
    "tour.account": { status: "in_progress", updatedAt: 50 },
  });
  const server = normalizeProgressMap({
    "tour.storefront": { status: "pending", updatedAt: 10 },
    "tour.account": { status: "completed", updatedAt: 200 },
  });
  const merged = mergeTourProgress(local, server);
  assert.equal(merged["tour.storefront"].status, "dismissed");
  assert.equal(merged["tour.account"].status, "completed");
  assert.equal(Object.keys(emptyTourProgress()).length, TOUR_IDS.length);
});
