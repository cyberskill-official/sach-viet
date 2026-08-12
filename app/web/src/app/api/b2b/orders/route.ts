import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { convertWonQuoteToOrder, createB2bOrderStore, listStaffOrders } from "@/lib/b2b-order-core.mjs";

async function sessionFor(request: Request) {
  return await readSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createB2bOrderStore();
    try {
      return NextResponse.json({ orders: await listStaffOrders(store, session.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Orders are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json();
    const store = await createB2bOrderStore();
    try {
      return NextResponse.json({ order: await convertWonQuoteToOrder(store, session.user, { quoteId: body?.quoteId }) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order conversion failed." }, { status: 400 });
  }
}
