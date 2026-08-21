import assert from "node:assert/strict";
import test from "node:test";
import {
  interimCommercePolicy,
  normalizeShipToAddress,
  stubTaxShippingLines,
  SHIP_TO_COUNTRIES,
  STUB_CARRIER_IDS,
  ZERO_MONEY_USD,
} from "../src/lib/commerce-core.mjs";

test("interimCommercePolicy 21b exposes stub tax engine and flat $0 shipping", () => {
  const policy = interimCommercePolicy();
  assert.equal(policy.version, "interim-owner-defaults-2026-08-21b");
  assert.equal(policy.taxEngine, "stub");
  assert.equal(policy.taxSource, "none");
  assert.equal(policy.salesTaxRatePercent, 0);
  assert.equal(policy.taxUsd, ZERO_MONEY_USD);
  assert.equal(policy.shippingUsd, ZERO_MONEY_USD);
  assert.equal(policy.flatRateUsd, ZERO_MONEY_USD);
  assert.equal(policy.carrierId, "none");
  assert.deepEqual([...SHIP_TO_COUNTRIES], ["US", "VN"]);
  assert.deepEqual([...STUB_CARRIER_IDS], ["none", "manual_pickup"]);
  assert.equal(policy.paymentsMode, "sandbox");
});

test("normalizeShipToAddress accepts US and VN required fields", () => {
  const us = normalizeShipToAddress({
    name: "Ada",
    line1: "1 Main St",
    city: "Austin",
    postal: "78701",
    country: "us",
    region: "TX",
  });
  assert.equal(us.country, "US");
  assert.equal(us.line1, "1 Main St");
  assert.equal(us.region, "TX");

  const vn = normalizeShipToAddress({
    name: "An",
    line1: "12 Nguyen Hue",
    city: "Ho Chi Minh",
    postal: "700000",
    country: "VN",
  });
  assert.equal(vn.country, "VN");

  assert.equal(normalizeShipToAddress(null), null);
  assert.throws(() => normalizeShipToAddress(null, { requireAddress: true }), /required/i);
  assert.throws(
    () => normalizeShipToAddress({ name: "X", line1: "1", city: "Y", postal: "1", country: "FR" }),
    /US or VN/,
  );
  assert.throws(
    () => normalizeShipToAddress({ name: "", line1: "1", city: "Y", postal: "1", country: "US" }),
    /name/i,
  );
});

test("stubTaxShippingLines always returns $0.00 and allows manual_pickup only", () => {
  const none = stubTaxShippingLines();
  assert.equal(none.taxUsd, ZERO_MONEY_USD);
  assert.equal(none.shippingUsd, ZERO_MONEY_USD);
  assert.equal(none.taxEngine, "stub");
  assert.equal(none.carrierId, "none");

  const pickup = stubTaxShippingLines({ carrierId: "manual_pickup" });
  assert.equal(pickup.carrierId, "manual_pickup");
  assert.equal(pickup.shippingUsd, ZERO_MONEY_USD);

  assert.throws(() => stubTaxShippingLines({ carrierId: "ups" }), /none or manual_pickup/);
});
