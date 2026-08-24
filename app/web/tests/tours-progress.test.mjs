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
  driverStepsFor,
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

test("auth and features tours do not auto-start", () => {
  assert.equal(shouldAutoStartTour("tour.auth"), false);
  assert.equal(shouldAutoStartTour("tour.features"), false);
  assert.equal(shouldAutoStartTour("tour.storefront"), true);
  assert.equal(shouldAutoStartTour("tour.portal_vendor"), true);
});

test("driver steps localize title + description and use data-tour elements", () => {
  const en = driverStepsFor("tour.storefront", "en", { onlyPresent: false });
  const vi = driverStepsFor("tour.storefront", "vi", { onlyPresent: false });
  assert.equal(en[0].popover.title, translate("en", "tours.title_storefront"));
  assert.equal(vi[0].popover.title, translate("vi", "tours.title_storefront"));
  assert.notEqual(en[0].popover.title, "Popover Title");
  assert.ok(
    en[0].popover.description.includes("Welcome") || en[0].popover.description.includes("Sách"),
  );
  assert.notEqual(en[0].popover.description, vi[0].popover.description);
  assert.ok(en[0].element.startsWith("[data-tour="));
  assert.equal(en[0].popover.align, "start");
});

test("pathForTourId returns primary routeHint", async () => {
  const { pathForTourId } = await import("../src/lib/tours/registry.mjs");
  assert.equal(pathForTourId("tour.features"), "/features");
  assert.equal(pathForTourId("tour.storefront"), "/");
  assert.equal(pathForTourId("tour.account"), "/account");
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
