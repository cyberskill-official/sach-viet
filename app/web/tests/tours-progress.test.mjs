import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyTourProgress,
  mergeTourProgress,
  normalizeProgressMap,
} from "../src/lib/tours/progress.mjs";
import { TOUR_IDS, getTourDefinition, joyrideStepsFor } from "../src/lib/tours/registry.mjs";

test("tour registry covers required flows", () => {
  for (const id of [
    "tour.storefront",
    "tour.product_cart",
    "tour.account",
    "tour.features",
    "tour.portal_overview",
  ]) {
    assert.ok(TOUR_IDS.includes(id));
    assert.ok(getTourDefinition(id)?.steps?.length >= 1);
  }
});

test("joyride steps localize content", () => {
  const en = joyrideStepsFor("tour.storefront", "en");
  const vi = joyrideStepsFor("tour.storefront", "vi");
  assert.ok(en[0].content.includes("Welcome") || en[0].content.includes("Sách"));
  assert.notEqual(en[0].content, vi[0].content);
  assert.ok(en[0].target.startsWith("[data-tour="));
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
