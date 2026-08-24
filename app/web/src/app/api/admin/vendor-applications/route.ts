import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createAdminCommerceStore, listVendorApplications } from "@/lib/admin-commerce-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createAdminCommerceStore();
    try { return NextResponse.json({ applications: await listVendorApplications(store, auth.user) }); } finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Vendor applications are unavailable." }, { status: 403 }); }
}
