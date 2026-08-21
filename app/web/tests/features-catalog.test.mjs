import assert from "node:assert/strict";
import test from "node:test";
import {
  availabilityFor,
  featureCatalog,
  FEATURE_AVAILABILITY,
  featuresByCategory,
} from "../src/lib/features-catalog.mjs";

test("feature catalog uses only known availability values", () => {
  assert.ok(featureCatalog.length >= 8);
  for (const feature of featureCatalog) {
    assert.ok(FEATURE_AVAILABILITY.includes(feature.availability), feature.id);
  }
});

test("DEC posture: sandbox pay available; live PV3/Zalo/tax>0/auth cutover upcoming or restricted", () => {
  assert.equal(availabilityFor("sandbox-checkout"), "available");
  assert.equal(availabilityFor("tax-stub"), "available");
  assert.equal(availabilityFor("live-pv3"), "upcoming");
  assert.equal(availabilityFor("tax-live"), "upcoming");
  assert.equal(availabilityFor("zalo-oa"), "upcoming");
  assert.equal(availabilityFor("auth-cutover"), "upcoming");
  assert.equal(availabilityFor("settlement-royalty"), "restricted");
});

test("features group by category", () => {
  const groups = featuresByCategory();
  assert.ok(groups.has("commerce"));
  assert.ok(groups.has("platform"));
  assert.ok(groups.get("commerce").some((f) => f.id === "sandbox-checkout"));
});
