import { NextResponse } from "next/server";
import { getFinancePolicySnapshot } from "@/lib/finance-policy-core.mjs";

/** Public policy snapshot — no secrets; documents DEC-deferred finance gates. */
export async function GET() {
  return NextResponse.json({
    policy: getFinancePolicySnapshot(),
    note: "Operational order/payout ledger rows may exist; settlement and royalty rate computation remain refused.",
  });
}
