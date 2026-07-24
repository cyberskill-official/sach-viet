import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createCommerceStore, createPendingOrder, createStripeCheckoutSession } from "@/lib/commerce-core.mjs";

export async function POST(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  let session;
  try { session = readSession(getAuthStore(), token, process.env.AUTH_SESSION_SECRET); } catch { return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 }); }
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const store = createCommerceStore();
  try {
    const order = createPendingOrder(store, session.user, body?.items);
    const checkout = await createStripeCheckoutSession(store, order.id);
    return NextResponse.json({ order, checkout }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed." }, { status: 400 }); } finally { store.close(); }
}
