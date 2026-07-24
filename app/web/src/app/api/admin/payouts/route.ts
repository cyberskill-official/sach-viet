import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createVendorCommerceStore, createVendorPayout } from "@/lib/vendor-commerce-core.mjs";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid payout request." }, { status: 400 });
    const store = createVendorCommerceStore();
    try { return NextResponse.json({ payout: createVendorPayout(store, session.user, body) }, { status: 201 }); }
    finally { store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Payout creation failed." }, { status: 403 }); }
}
