import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createVendorCommerceStore, getVendorDashboard } from "@/lib/vendor-commerce-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const vendorId = new URL(request.url).searchParams.get("vendorId") || undefined;
    const store = await createVendorCommerceStore();
    try { return NextResponse.json({ dashboard: await getVendorDashboard(store, auth.user, { vendorId }) }); } finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Vendor dashboard is unavailable." }, { status: 403 }); }
}
