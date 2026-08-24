/**
 * Finance policy from DEC-SET-001 / DEC-ROY-001 / DEC-B2B-001
 * (interim-owner-defaults-2026-08-21). Rates are DEC-sourced only — do not invent extras.
 */

import { canRole } from "./access.mjs";

export const FINANCE_POLICY_VERSION = "interim-owner-defaults-2026-08-21";

/** @see docs/decisions/DEC-SET-001.md */
export const DEC_SET_COMMISSION_RATE = 0.15;
export const DEC_SET_RESERVE_RATE = 0;
export const DEC_SET_RESERVE_HOLD_DAYS = 0;
export const DEC_SET_CADENCE = "weekly";
export const DEC_SET_THRESHOLD_USD = "50.0000";
export const DEC_SET_PAYOUT_RAIL = "manual/sandbox";

/** @see docs/decisions/DEC-ROY-001.md */
export const DEC_ROY_AUTHOR_RATE = 0.1;
export const DEC_ROY_RESERVE_RATE = 0;
export const DEC_ROY_PERIOD = "quarterly";
export const DEC_ROY_ADVANCES = false;
export const DEC_ROY_RECOGNITION = "paid";

/** @see docs/decisions/DEC-B2B-001.md */
export const DEC_B2B_QUOTE_VALIDITY_DAYS = 30;
export const DEC_B2B_MAX_DISCOUNT_PERCENT = 20;
export const DEC_B2B_NET_DAYS = 30;

export const SETTLEMENT_POLICY = Object.freeze({
  decisionId: "DEC-SET-001",
  status: "accepted_interim",
  version: FINANCE_POLICY_VERSION,
  commissionRateAccepted: true,
  commissionRate: DEC_SET_COMMISSION_RATE,
  reserveAccepted: true,
  reserveRate: DEC_SET_RESERVE_RATE,
  reserveHoldDays: DEC_SET_RESERVE_HOLD_DAYS,
  cadenceAccepted: true,
  cadence: DEC_SET_CADENCE,
  thresholdAccepted: true,
  thresholdUsd: DEC_SET_THRESHOLD_USD,
  payoutRailAccepted: true,
  payoutRail: DEC_SET_PAYOUT_RAIL,
  message:
    "Vendor settlement uses DEC-SET-001 interim-owner-defaults-2026-08-21: 15% commission, reserve 0, weekly, $50 threshold, manual/sandbox rail.",
});

export const ROYALTY_POLICY = Object.freeze({
  decisionId: "DEC-ROY-001",
  status: "accepted_interim",
  version: FINANCE_POLICY_VERSION,
  royaltyRateAccepted: true,
  royaltyRate: DEC_ROY_AUTHOR_RATE,
  splitAccepted: true,
  statementPeriodAccepted: true,
  statementPeriod: DEC_ROY_PERIOD,
  advances: DEC_ROY_ADVANCES,
  reserveRate: DEC_ROY_RESERVE_RATE,
  recognition: DEC_ROY_RECOGNITION,
  currencyWhenActivated: "USD",
  message:
    "Royalty compute uses DEC-ROY-001 interim-owner-defaults-2026-08-21: author 10% of net, quarterly, no advances, recognition on paid.",
});

export const B2B_COMMERCIAL_POLICY = Object.freeze({
  decisionId: "DEC-B2B-001",
  status: "accepted_interim",
  version: FINANCE_POLICY_VERSION,
  netTermsAccepted: true,
  netDays: DEC_B2B_NET_DAYS,
  discountMatrixAccepted: true,
  discountAuthority: "admin_only",
  maxDiscountPercent: DEC_B2B_MAX_DISCOUNT_PERCENT,
  quoteValidityDaysAccepted: true,
  quoteValidityDays: DEC_B2B_QUOTE_VALIDITY_DAYS,
  message:
    "B2B commercial terms from DEC-B2B-001 interim-owner-defaults-2026-08-21: quote validity 30d, admin-only discount max 20%, Net-30.",
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

function moneyUnits(value) {
  const text = typeof value === "string" ? value : String(value ?? "");
  if (!/^\d+(?:\.\d{1,4})?$/.test(text)) throw new Error("Money must be a non-negative decimal string.");
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0"));
}

function moneyString(units) {
  const sign = units < 0n ? "-" : "";
  const abs = units < 0n ? -units : units;
  return `${sign}${abs / 10000n}.${String(abs % 10000n).padStart(4, "0")}`;
}

/**
 * Compute vendor settlement from paid line amounts using DEC-SET interim rates.
 * @param {{ vendorId?: string, lines?: Array<{ lineNetUsd?: string, amountUsd?: string }> }} input
 */
export function computeVendorSettlement(input = {}) {
  const lines = Array.isArray(input?.lines) ? input.lines : [];
  let grossUnits = 0n;
  for (const line of lines) {
    const amount = line?.lineNetUsd ?? line?.amountUsd;
    if (amount == null) continue;
    grossUnits += moneyUnits(amount);
  }
  const commissionUnits = (grossUnits * BigInt(Math.round(DEC_SET_COMMISSION_RATE * 10000))) / 10000n;
  const reserveUnits = (grossUnits * BigInt(Math.round(DEC_SET_RESERVE_RATE * 10000))) / 10000n;
  const netPayoutUnits = grossUnits - commissionUnits - reserveUnits;
  return {
    decisionId: "DEC-SET-001",
    version: FINANCE_POLICY_VERSION,
    vendorId: typeof input?.vendorId === "string" ? input.vendorId : null,
    commissionRate: DEC_SET_COMMISSION_RATE,
    reserveRate: DEC_SET_RESERVE_RATE,
    cadence: DEC_SET_CADENCE,
    thresholdUsd: DEC_SET_THRESHOLD_USD,
    payoutRail: DEC_SET_PAYOUT_RAIL,
    grossUsd: moneyString(grossUnits),
    commissionUsd: moneyString(commissionUnits),
    reserveUsd: moneyString(reserveUnits),
    netPayoutUsd: moneyString(netPayoutUnits),
    meetsThreshold: netPayoutUnits >= moneyUnits(DEC_SET_THRESHOLD_USD),
  };
}

/**
 * Compute royalty statement preview using DEC-ROY interim rates.
 * @param {{ payeeId?: string, authorId?: string, lines?: Array<{ lineNetUsd?: string, amountUsd?: string, returned?: boolean }> }} input
 */
export function computeRoyaltyStatement(input = {}) {
  const lines = Array.isArray(input?.lines) ? input.lines : [];
  let grossUnits = 0n;
  let returnUnits = 0n;
  for (const line of lines) {
    const amount = line?.lineNetUsd ?? line?.amountUsd;
    if (amount == null) continue;
    const units = moneyUnits(amount);
    if (line?.returned) returnUnits += units;
    else grossUnits += units;
  }
  const netSalesUnits = grossUnits - returnUnits;
  const royaltyUnits = (netSalesUnits * BigInt(Math.round(DEC_ROY_AUTHOR_RATE * 10000))) / 10000n;
  return {
    decisionId: "DEC-ROY-001",
    version: FINANCE_POLICY_VERSION,
    payeeId: typeof input?.payeeId === "string" ? input.payeeId : (typeof input?.authorId === "string" ? input.authorId : null),
    royaltyRate: DEC_ROY_AUTHOR_RATE,
    recognition: DEC_ROY_RECOGNITION,
    period: DEC_ROY_PERIOD,
    advances: DEC_ROY_ADVANCES,
    currency: "USD",
    grossUsd: moneyString(grossUnits),
    returnsUsd: moneyString(returnUnits),
    netSalesUsd: moneyString(netSalesUnits < 0n ? 0n : netSalesUnits),
    royaltyUsd: moneyString(royaltyUnits < 0n ? 0n : royaltyUnits),
  };
}

/**
 * @param {string} amountUsd
 * @returns {boolean} true when the string is a positive money amount (operational ledger only)
 */
export function isOperationalMoneyAmount(amountUsd) {
  return typeof amountUsd === "string" && /^\d+(?:\.\d{1,4})?$/.test(amountUsd) && Number(amountUsd) > 0;
}

/**
 * Apply admin-only discount within DEC-B2B max.
 * @param {string} subtotalUsd
 * @param {number} discountPercent
 * @param {{ role?: string }} actor
 */
export function applyB2bDiscount(subtotalUsd, discountPercent, actor = {}) {
  if (!canRole(actor?.role, "admin.b2b.discount")) {
    throw new Error("DEC-B2B-001: discount authority is admin-only.");
  }
  const percent = Number(discountPercent);
  if (!Number.isFinite(percent) || percent < 0 || percent > DEC_B2B_MAX_DISCOUNT_PERCENT) {
    throw new Error(`DEC-B2B-001: discount must be 0–${DEC_B2B_MAX_DISCOUNT_PERCENT}%.`);
  }
  const units = moneyUnits(subtotalUsd);
  const discountUnits = (units * BigInt(Math.round(percent * 100))) / 10000n;
  return {
    decisionId: "DEC-B2B-001",
    version: FINANCE_POLICY_VERSION,
    discountPercent: percent,
    subtotalUsd: moneyString(units),
    discountUsd: moneyString(discountUnits),
    netUsd: moneyString(units - discountUnits),
    netDays: DEC_B2B_NET_DAYS,
    quoteValidityDays: DEC_B2B_QUOTE_VALIDITY_DAYS,
  };
}

/**
 * @param {number} createdAtMs
 * @param {number} [nowMs]
 */
export function isB2bQuoteExpired(createdAtMs, nowMs = Date.now()) {
  if (!Number.isFinite(createdAtMs)) return true;
  const ttlMs = DEC_B2B_QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
  return nowMs > createdAtMs + ttlMs;
}
