import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createCommerceStore, listCustomerOrders } from "@/lib/commerce-core.mjs";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  try {
    const session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createCommerceStore();
    try { return NextResponse.json({ orders: listCustomerOrders(store, session.user) }); } finally { store.close(); }
  } catch { return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 }); }
}
