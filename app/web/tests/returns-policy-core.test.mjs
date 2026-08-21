import assert from "node:assert/strict";
import test from "node:test";
import {
  RETURNS_POLICY,
  buildRefundPathStub,
  evaluateReturnEligibility,
  getReturnsPolicySnapshot,
} from "../src/lib/returns-policy-core.mjs";

test("returns policy snapshot matches DEC-RET interim", () => {
  const policy = getReturnsPolicySnapshot();
  assert.equal(policy.decisionId, "DEC-RET-001");
  assert.equal(policy.windowDays, 14);
  assert.equal(policy.restockFeePercent, 0);
  assert.equal(policy.returnsPolicy, "interim_14d_defects");
  assert.equal(RETURNS_POLICY.refundMethod, "original_payment_method");
});

test("evaluateReturnEligibility enforces 14-day defect window", () => {
  const paidAt = Date.UTC(2026, 0, 1);
  const ok = evaluateReturnEligibility({
    paidAt,
    now: paidAt + 10 * 24 * 60 * 60 * 1000,
    reason: "physical_defect",
  });
  assert.equal(ok.eligible, true);
  const late = evaluateReturnEligibility({
    paidAt,
    now: paidAt + 20 * 24 * 60 * 60 * 1000,
    reason: "physical_defect",
  });
  assert.equal(late.eligible, false);
  const mind = evaluateReturnEligibility({
    paidAt,
    now: paidAt + 1 * 24 * 60 * 60 * 1000,
    reason: "change_of_mind",
  });
  assert.equal(mind.eligible, false);
});

test("refund path stub stays sandbox-gated", () => {
  const stub = buildRefundPathStub({ orderId: "o1", lineAmountUsd: "12.0000" });
  assert.equal(stub.refundMethod, "original_payment_method");
  assert.match(stub.note, /DEC-PV3-001/);
});
