import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { convertWonQuoteToOrder, createB2bOrderStore, listStaffOrders } from "@/lib/b2b-order-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createB2bOrderStore();
    try {
      return NextResponse.json({ orders: await listStaffOrders(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Orders are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const store = await createB2bOrderStore();
    try {
      return NextResponse.json({ order: await convertWonQuoteToOrder(store, auth.user, { quoteId: body?.quoteId }) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order conversion failed." }, { status: 400 });
  }
}
