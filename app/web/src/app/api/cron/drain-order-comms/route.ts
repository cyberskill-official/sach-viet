import { NextResponse } from "next/server";
import { createCommerceStore, expirePendingOrders } from "@/lib/commerce-core.mjs";
import { processOrderCommsOutbox } from "@/lib/order-comms-core.mjs";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) return unauthorized();
  const store = await createCommerceStore();
  try {
    const expired = await expirePendingOrders(store, {
      limit: Number(process.env.PENDING_ORDER_EXPIRE_LIMIT || 50),
    });
    const summary = await processOrderCommsOutbox(store, {
      limit: Number(process.env.ORDER_COMMS_DRAIN_LIMIT || 50),
    });
    return NextResponse.json({ ok: true, expired, summary });
  } finally {
    await store.close();
  }
}
