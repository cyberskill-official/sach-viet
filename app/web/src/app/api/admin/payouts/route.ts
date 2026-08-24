import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { SETTLEMENT_POLICY } from "@/lib/finance-policy-core.mjs";
import { createVendorCommerceStore, createVendorPayout, listAdminPayouts } from "@/lib/vendor-commerce-core.mjs";
import { commerceMutationsDisabledMessage, commerceMutationsEnabled } from "@/lib/commerce-kill-switch.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createVendorCommerceStore();
    try {
      return NextResponse.json({
        payouts: await listAdminPayouts(store, auth.user),
        settlementPolicy: SETTLEMENT_POLICY,
        note: "Operational payout ledger; settlement preview uses DEC-SET-001 interim 15% via /api/finance/compute.",
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payouts are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    if (!commerceMutationsEnabled()) {
      return NextResponse.json({ error: commerceMutationsDisabledMessage() }, { status: 503 });
    }
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid payout request." }, { status: 400 });
    const store = await createVendorCommerceStore();
    try {
      return NextResponse.json({
        payout: await createVendorPayout(store, auth.user, body),
        settlementPolicy: SETTLEMENT_POLICY,
      }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payout creation failed." }, { status: 403 });
  }
}

