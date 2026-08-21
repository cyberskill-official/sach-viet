import assert from "node:assert/strict";
import test from "node:test";
import {
  B2B_COMMERCIAL_POLICY,
  DEC_B2B_NET_DAYS,
  DEC_B2B_QUOTE_VALIDITY_DAYS,
  DEC_ROY_AUTHOR_RATE,
  DEC_SET_COMMISSION_RATE,
  ROYALTY_POLICY,
  SETTLEMENT_POLICY,
  applyB2bDiscount,
  computeRoyaltyStatement,
  computeVendorSettlement,
  getFinancePolicySnapshot,
  isB2bQuoteExpired,
  isOperationalMoneyAmount,
} from "../src/lib/finance-policy-core.mjs";

test("finance policy snapshot marks SET/ROY/B2B accepted interim with DEC rates", () => {
  const snapshot = getFinancePolicySnapshot();
  assert.equal(snapshot.settlement.status, "accepted_interim");
  assert.equal(snapshot.settlement.commissionRateAccepted, true);
  assert.equal(snapshot.settlement.commissionRate, DEC_SET_COMMISSION_RATE);
  assert.equal(snapshot.royalty.status, "accepted_interim");
  assert.equal(snapshot.royalty.royaltyRateAccepted, true);
  assert.equal(snapshot.royalty.royaltyRate, DEC_ROY_AUTHOR_RATE);
  assert.equal(snapshot.royalty.currencyWhenActivated, "USD");
  assert.equal(snapshot.b2b.netTermsAccepted, true);
  assert.equal(snapshot.b2b.netDays, DEC_B2B_NET_DAYS);
  assert.equal(snapshot.b2b.quoteValidityDays, DEC_B2B_QUOTE_VALIDITY_DAYS);
  assert.equal(SETTLEMENT_POLICY.decisionId, "DEC-SET-001");
  assert.equal(ROYALTY_POLICY.decisionId, "DEC-ROY-001");
  assert.equal(B2B_COMMERCIAL_POLICY.decisionId, "DEC-B2B-001");
});

test("computeVendorSettlement uses DEC-SET 15% commission", () => {
  const result = computeVendorSettlement({
    vendorId: "v1",
    lines: [{ lineNetUsd: "100.0000" }],
  });
  assert.equal(result.commissionRate, 0.15);
  assert.equal(result.grossUsd, "100.0000");
  assert.equal(result.commissionUsd, "15.0000");
  assert.equal(result.netPayoutUsd, "85.0000");
  assert.equal(result.meetsThreshold, true);
});

test("computeRoyaltyStatement uses DEC-ROY 10% author rate", () => {
  const result = computeRoyaltyStatement({
    authorId: "a1",
    lines: [{ lineNetUsd: "100.0000" }, { lineNetUsd: "20.0000", returned: true }],
  });
  assert.equal(result.royaltyRate, 0.1);
  assert.equal(result.grossUsd, "100.0000");
  assert.equal(result.returnsUsd, "20.0000");
  assert.equal(result.netSalesUsd, "80.0000");
  assert.equal(result.royaltyUsd, "8.0000");
});

test("B2B discount is admin-only and capped at 20%", () => {
  assert.throws(() => applyB2bDiscount("100.0000", 10, { role: "employee_b2b" }), /admin-only/);
  assert.throws(() => applyB2bDiscount("100.0000", 25, { role: "admin" }), /0–20/);
  const preview = applyB2bDiscount("100.0000", 20, { role: "admin" });
  assert.equal(preview.discountUsd, "20.0000");
  assert.equal(preview.netUsd, "80.0000");
  assert.equal(preview.netDays, 30);
});

test("B2B quote expiry follows 30-day validity", () => {
  const createdAt = Date.UTC(2026, 0, 1);
  assert.equal(isB2bQuoteExpired(createdAt, createdAt + 29 * 24 * 60 * 60 * 1000), false);
  assert.equal(isB2bQuoteExpired(createdAt, createdAt + 31 * 24 * 60 * 60 * 1000), true);
});

test("operational money amounts are validated without implying live rails", () => {
  assert.equal(isOperationalMoneyAmount("12.50"), true);
  assert.equal(isOperationalMoneyAmount("0"), false);
  assert.equal(isOperationalMoneyAmount("-1"), false);
  assert.equal(isOperationalMoneyAmount("12%"), false);
});
