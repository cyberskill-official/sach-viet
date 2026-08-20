import assert from "node:assert/strict";
import test from "node:test";
import {
  B2B_COMMERCIAL_POLICY,
  ROYALTY_POLICY,
  SETTLEMENT_POLICY,
  computeRoyaltyStatement,
  computeVendorSettlement,
  getFinancePolicySnapshot,
  isOperationalMoneyAmount,
} from "../src/lib/finance-policy-core.mjs";

test("finance policy snapshot marks SET/ROY/B2B as deferred without inventing rates", () => {
  const snapshot = getFinancePolicySnapshot();
  assert.equal(snapshot.settlement.status, "deferred");
  assert.equal(snapshot.settlement.commissionRateAccepted, false);
  assert.equal(snapshot.royalty.status, "deferred");
  assert.equal(snapshot.royalty.royaltyRateAccepted, false);
  assert.equal(snapshot.royalty.currencyWhenActivated, "USD");
  assert.equal(snapshot.b2b.netTermsAccepted, false);
  assert.equal(SETTLEMENT_POLICY.decisionId, "DEC-SET-001");
  assert.equal(ROYALTY_POLICY.decisionId, "DEC-ROY-001");
  assert.equal(B2B_COMMERCIAL_POLICY.decisionId, "DEC-B2B-001");
});

test("computeVendorSettlement refuses until DEC-SET accepts rates", () => {
  assert.throws(() => computeVendorSettlement({ vendorId: "v1", lines: [] }), /DEC-SET-001/);
  assert.throws(() => computeVendorSettlement({ commissionRate: 0.15 }), /refused/);
});

test("computeRoyaltyStatement refuses until DEC-ROY accepts rates", () => {
  assert.throws(() => computeRoyaltyStatement({ authorId: "a1" }), /DEC-ROY-001/);
  assert.throws(() => computeRoyaltyStatement({ rate: 0.1 }), /refused/);
});

test("operational money amounts are validated without implying commission policy", () => {
  assert.equal(isOperationalMoneyAmount("12.50"), true);
  assert.equal(isOperationalMoneyAmount("0"), false);
  assert.equal(isOperationalMoneyAmount("-1"), false);
  assert.equal(isOperationalMoneyAmount("12%"), false);
});
