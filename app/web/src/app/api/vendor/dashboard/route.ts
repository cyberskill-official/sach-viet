import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createVendorCommerceStore, getVendorDashboard } from "@/lib/vendor-commerce-core.mjs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const vendorId = new URL(request.url).searchParams.get("vendorId") || undefined;
    const store = createVendorCommerceStore();
    try { return NextResponse.json({ dashboard: getVendorDashboard(store, session.user, { vendorId }) }); } finally { store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Vendor dashboard is unavailable." }, { status: 403 }); }
}
