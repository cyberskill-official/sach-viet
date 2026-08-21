import { NextResponse } from "next/server";
import {
  buildRefundPathStub,
  evaluateReturnEligibility,
  getReturnsPolicySnapshot,
} from "@/lib/returns-policy-core.mjs";

/** Public returns policy + eligibility/refund stub helpers (DEC-RET interim). */
export async function GET() {
  return NextResponse.json({ policy: getReturnsPolicySnapshot() });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "JSON body is required." } }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action.trim() : "eligibility";
  if (action === "refund_stub") {
    return NextResponse.json({
      refund: buildRefundPathStub({
        orderId: typeof body.orderId === "string" ? body.orderId : undefined,
        lineAmountUsd: typeof body.lineAmountUsd === "string" ? body.lineAmountUsd : undefined,
        paymentProvider: typeof body.paymentProvider === "string" ? body.paymentProvider : undefined,
      }),
    });
  }

  const eligibility = evaluateReturnEligibility({
    paidAt: typeof body.paidAt === "number" ? body.paidAt : undefined,
    deliveredAt: typeof body.deliveredAt === "number" ? body.deliveredAt : null,
    now: typeof body.now === "number" ? body.now : undefined,
    reason: typeof body.reason === "string" ? body.reason : undefined,
  });
  return NextResponse.json({ eligibility });
}
