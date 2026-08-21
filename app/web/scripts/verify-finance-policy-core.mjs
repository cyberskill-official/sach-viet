#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const core = readFileSync(join(root, "src/lib/finance-policy-core.mjs"), "utf8");
const vendor = readFileSync(join(root, "src/lib/vendor-commerce-core.mjs"), "utf8");

for (const needle of [
  "computeVendorSettlement",
  "computeRoyaltyStatement",
  "DEC-SET-001",
  "DEC-ROY-001",
  "interim-owner-defaults-2026-08-21",
  "DEC_SET_COMMISSION_RATE",
  "DEC_ROY_AUTHOR_RATE",
]) {
  if (!core.includes(needle)) throw new Error(`finance-policy-core missing ${needle}`);
}

if (!core.includes("0.15") || !core.includes("0.1")) {
  throw new Error("finance-policy-core must cite DEC-sourced interim rates.");
}

if (!vendor.includes("Commission-rate settlement is refused")) {
  throw new Error("vendor-commerce-core must refuse ad-hoc commissionRate inputs on ledger create.");
}

console.log("verify-finance-policy-core: ok");
