import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createAdminCommerceStore, getAdminCommerceDashboard } from "@/lib/admin-commerce-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createAdminCommerceStore();
    try { return NextResponse.json({ dashboard: await getAdminCommerceDashboard(store, auth.user) }); } finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Admin dashboard is unavailable." }, { status: 403 }); }
}
