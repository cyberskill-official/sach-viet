import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createAdminCommerceStore, submitVendorApplication } from "@/lib/admin-commerce-core.mjs";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createAdminCommerceStore();
    try { return NextResponse.json({ application: submitVendorApplication(store, session.user) }, { status: 201 }); } finally { store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Vendor application could not be submitted." }, { status: 400 }); }
}
