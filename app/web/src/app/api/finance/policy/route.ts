import { NextResponse } from "next/server";
import { getFinancePolicySnapshot } from "@/lib/finance-policy-core.mjs";
import { getReturnsPolicySnapshot } from "@/lib/returns-policy-core.mjs";

/** Public policy snapshot — DEC interim-owner-defaults-2026-08-21 rates (no secrets). */
export async function GET() {
  return NextResponse.json({
    policy: getFinancePolicySnapshot(),
    returns: getReturnsPolicySnapshot(),
    note: "Settlement/royalty/B2B/returns use interim-owner-defaults-2026-08-21. Live PV3 remains refused.",
  });
}
