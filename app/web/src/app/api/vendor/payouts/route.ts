import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { SETTLEMENT_POLICY } from "@/lib/finance-policy-core.mjs";
import { createVendorCommerceStore, listVendorPayouts } from "@/lib/vendor-commerce-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const vendorId = new URL(request.url).searchParams.get("vendorId") || undefined;
    const store = await createVendorCommerceStore();
    try {
      return NextResponse.json({
        payouts: await listVendorPayouts(store, auth.user, { vendorId }),
        settlementPolicy: SETTLEMENT_POLICY,
        note: "Operational payout ledger only; commission computation refused until DEC-SET-001.",
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vendor payouts are unavailable." }, { status: 403 });
  }
}

