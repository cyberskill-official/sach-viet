import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createAdminCommerceStore, getAdminCommerceDashboard } from "@/lib/admin-commerce-core.mjs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createAdminCommerceStore();
    try { return NextResponse.json({ dashboard: await getAdminCommerceDashboard(store, session.user) }); } finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Admin dashboard is unavailable." }, { status: 403 }); }
}
