/**
 * Finance policy scaffolding under interim DEC-SET-001 / DEC-ROY-001.
 * Operational payout ledgers may exist elsewhere; this module refuses any
 * rate/commission/royalty computation until those DECs are revised with concrete values.
 */

export const FINANCE_POLICY_VERSION = "interim-defaults-2026-08-20";

export const SETTLEMENT_POLICY = Object.freeze({
  decisionId: "DEC-SET-001",
  status: "deferred",
  version: FINANCE_POLICY_VERSION,
  commissionRateAccepted: false,
  reserveAccepted: false,
  cadenceAccepted: false,
  thresholdAccepted: false,
  payoutRailAccepted: false,
  message:
    "Vendor settlement, commission, reserves, cadence, thresholds, and payout rails are deferred until Phase 5 (DEC-SET-001). No commission rate is accepted.",
});

export const ROYALTY_POLICY = Object.freeze({
  decisionId: "DEC-ROY-001",
  status: "deferred",
  version: FINANCE_POLICY_VERSION,
  royaltyRateAccepted: false,
  splitAccepted: false,
  statementPeriodAccepted: false,
  currencyWhenActivated: "USD",
  message:
    "Royalty rates, splits, recognition, advances, reserves, and statements are deferred until Phase 5 (DEC-ROY-001). No royalty rate is accepted.",
});

export const B2B_COMMERCIAL_POLICY = Object.freeze({
  decisionId: "DEC-B2B-001",
  status: "deferred",
  version: FINANCE_POLICY_VERSION,
  netTermsAccepted: false,
  discountMatrixAccepted: false,
  quoteValidityDaysAccepted: false,
  message:
    "B2B Net-N, discount authority, and quote validity days are deferred (DEC-B2B-001). Existing quote→order shells are not payment-terms policy.",
});

/**
 * @returns {{ settlement: typeof SETTLEMENT_POLICY, royalty: typeof ROYALTY_POLICY, b2b: typeof B2B_COMMERCIAL_POLICY }}
 */
export function getFinancePolicySnapshot() {
  return {
    settlement: SETTLEMENT_POLICY,
    royalty: ROYALTY_POLICY,
    b2b: B2B_COMMERCIAL_POLICY,
  };
}

/**
 * Refuse commission / settlement math until DEC-SET accepts rates.
 * @param {unknown} [_input]
 * @returns {never}
 */
export function computeVendorSettlement(_input) {
  throw new Error(
    "Vendor settlement computation is refused until DEC-SET-001 accepts commission/reserve/cadence values. Do not invent rates.",
  );
}

/**
 * Refuse royalty statement math until DEC-ROY accepts rates.
 * @param {unknown} [_input]
 * @returns {never}
 */
export function computeRoyaltyStatement(_input) {
  throw new Error(
    "Royalty statement computation is refused until DEC-ROY-001 accepts rate/split/period values. Do not invent rates.",
  );
}

/**
 * @param {string} amountUsd
 * @returns {boolean} true when the string is a positive money amount (operational ledger only)
 */
export function isOperationalMoneyAmount(amountUsd) {
  return typeof amountUsd === "string" && /^\d+(?:\.\d{1,4})?$/.test(amountUsd) && Number(amountUsd) > 0;
}
