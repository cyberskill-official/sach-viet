import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createAdminCommerceStore, submitVendorApplication } from "@/lib/admin-commerce-core.mjs";

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createAdminCommerceStore();
    try { return NextResponse.json({ application: await submitVendorApplication(store, auth.user) }, { status: 201 }); } finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Vendor application could not be submitted." }, { status: 400 }); }
}
