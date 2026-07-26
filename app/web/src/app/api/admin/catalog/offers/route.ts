import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createAdminCatalogStore, writeAdminVendorOffer } from "@/lib/admin-catalog-core.mjs";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid offer request." }, { status: 400 });
    const store = createAdminCatalogStore();
    try {
      return NextResponse.json({ offer: writeAdminVendorOffer(store, session.user, body) }, { status: 201 });
    } finally {
      store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Offer write failed.";
    const status = /Administrator/i.test(message) ? 403 : /required|does not exist|belong|Money|Stock/i.test(message) ? 400 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
