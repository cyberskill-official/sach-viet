/**
 * Thin returns / refund policy from DEC-RET-001 (interim-owner-defaults-2026-08-21).
 * Stubs eligibility + refund path metadata; does not invent live provider refunds.
 */

export const RETURNS_POLICY_VERSION = "interim-owner-defaults-2026-08-21";

/** @see docs/decisions/DEC-RET-001.md */
export const DEC_RET_WINDOW_DAYS = 14;
export const DEC_RET_RESTOCK_FEE_PERCENT = 0;
export const DEC_RET_EVIDENCE_PHOTO = "optional";
export const DEC_RET_REFUND_METHOD = "original_payment_method";
export const DEC_RET_ELIGIBILITY = Object.freeze([
  "physical_defect",
  "damage",
  "wrong_item",
]);

export const RETURNS_POLICY = Object.freeze({
  decisionId: "DEC-RET-001",
  status: "accepted_interim",
  version: RETURNS_POLICY_VERSION,
  returnsPolicy: "interim_14d_defects",
  windowDays: DEC_RET_WINDOW_DAYS,
  eligibility: DEC_RET_ELIGIBILITY,
  evidencePhoto: DEC_RET_EVIDENCE_PHOTO,
  restockFeePercent: DEC_RET_RESTOCK_FEE_PERCENT,
  refundMethod: DEC_RET_REFUND_METHOD,
  exchanges: "deferred",
  message:
    "Returns use DEC-RET-001 interim-owner-defaults-2026-08-21: 14-day defect/damage/wrong-item window, restock 0%, refund to original method, photo optional.",
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * @param {{ paidAt?: number, deliveredAt?: number | null, now?: number }} input
 */
export function returnsWindowClosesAt({ paidAt, deliveredAt = null, now: _now } = {}) {
  const anchor = Number.isFinite(deliveredAt) && deliveredAt != null ? deliveredAt : paidAt;
  if (!Number.isFinite(anchor)) return null;
  return anchor + DEC_RET_WINDOW_DAYS * MS_PER_DAY;
}

/**
 * @param {{ paidAt?: number, deliveredAt?: number | null, now?: number, reason?: string }} input
 */
export function evaluateReturnEligibility(input = {}) {
  const now = Number.isFinite(input.now) ? input.now : Date.now();
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  const closesAt = returnsWindowClosesAt({
    paidAt: input.paidAt,
    deliveredAt: input.deliveredAt,
  });
  const withinWindow = closesAt != null && now <= closesAt;
  const reasonOk = DEC_RET_ELIGIBILITY.includes(reason);
  const eligible = Boolean(withinWindow && reasonOk);
  return {
    decisionId: "DEC-RET-001",
    version: RETURNS_POLICY_VERSION,
    eligible,
    reason,
    reasonAccepted: reasonOk,
    withinWindow,
    windowClosesAt: closesAt,
    restockFeePercent: DEC_RET_RESTOCK_FEE_PERCENT,
    refundMethod: DEC_RET_REFUND_METHOD,
    evidencePhoto: DEC_RET_EVIDENCE_PHOTO,
    message: eligible
      ? "Return eligible under interim DEC-RET-001."
      : "Return not eligible under interim DEC-RET-001 (window or reason).",
  };
}

/**
 * Refund path stub — metadata only; live provider refunds stay sandbox/PV3-gated.
 * @param {{ orderId?: string, lineAmountUsd?: string, paymentProvider?: string }} input
 */
export function buildRefundPathStub(input = {}) {
  return {
    decisionId: "DEC-RET-001",
    version: RETURNS_POLICY_VERSION,
    orderId: typeof input.orderId === "string" ? input.orderId : null,
    lineAmountUsd: typeof input.lineAmountUsd === "string" ? input.lineAmountUsd : null,
    refundMethod: DEC_RET_REFUND_METHOD,
    restockFeePercent: DEC_RET_RESTOCK_FEE_PERCENT,
    providerPath: "sandbox_or_manual_ledger",
    paymentProvider: typeof input.paymentProvider === "string" ? input.paymentProvider : "sandbox",
    note: "Refund stub only — live keys remain refused (DEC-PV3-001).",
  };
}

export function getReturnsPolicySnapshot() {
  return RETURNS_POLICY;
}
