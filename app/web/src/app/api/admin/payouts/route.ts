import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createVendorCommerceStore, createVendorPayout, listAdminPayouts } from "@/lib/vendor-commerce-core.mjs";
import { commerceMutationsDisabledMessage, commerceMutationsEnabled } from "@/lib/commerce-kill-switch.mjs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createVendorCommerceStore();
    try { return NextResponse.json({ payouts: await listAdminPayouts(store, session.user) }); }
    finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Payouts are unavailable." }, { status: 403 }); }
}

export async function POST(request: Request) {
  try {
    if (!commerceMutationsEnabled()) {
      return NextResponse.json({ error: commerceMutationsDisabledMessage() }, { status: 503 });
    }
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid payout request." }, { status: 400 });
    const store = await createVendorCommerceStore();
    try { return NextResponse.json({ payout: await createVendorPayout(store, session.user, body) }, { status: 201 }); }
    finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Payout creation failed." }, { status: 403 }); }
}
