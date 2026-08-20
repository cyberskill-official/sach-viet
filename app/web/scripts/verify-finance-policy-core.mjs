#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const core = readFileSync(join(root, "src/lib/finance-policy-core.mjs"), "utf8");
const vendor = readFileSync(join(root, "src/lib/vendor-commerce-core.mjs"), "utf8");

for (const needle of ["computeVendorSettlement", "computeRoyaltyStatement", "DEC-SET-001", "DEC-ROY-001", "deferred"]) {
  if (!core.includes(needle)) throw new Error(`finance-policy-core missing ${needle}`);
}

if (/commissionRate\s*=\s*0\.\d+/.test(core) || /royaltyRate\s*=\s*0\.\d+/.test(core)) {
  throw new Error("finance-policy-core must not invent numeric rates.");
}

if (!vendor.includes("Commission-rate settlement is refused")) {
  throw new Error("vendor-commerce-core must refuse commissionRate inputs.");
}

console.log("verify-finance-policy-core: ok");
