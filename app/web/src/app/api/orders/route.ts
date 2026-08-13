import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createCommerceStore, listCustomerOrders } from "@/lib/commerce-core.mjs";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  try {
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createCommerceStore();
    try {
      const url = new URL(request.url);
      const after = url.searchParams.get("after") ?? undefined;
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam ? Number(limitParam) : 50;
      return NextResponse.json({ orders: await listCustomerOrders(store, session.user, { after, limit }) });
    } finally { await store.close(); }
  } catch { return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 }); }
}
