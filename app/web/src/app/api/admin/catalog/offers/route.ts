import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createAdminCatalogStore, writeAdminVendorOffer } from "@/lib/admin-catalog-core.mjs";

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid offer request." }, { status: 400 });
    const store = await createAdminCatalogStore();
    try {
      return NextResponse.json({ offer: await writeAdminVendorOffer(store, auth.user, body) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Offer write failed.";
    const status = /Administrator/i.test(message) ? 403 : /required|does not exist|belong|Money|Stock/i.test(message) ? 400 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
