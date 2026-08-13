import { NextResponse } from "next/server";
import { createCommerceStore } from "@/lib/commerce-core.mjs";
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
    const summary = await processOrderCommsOutbox(store, {
      limit: Number(process.env.ORDER_COMMS_DRAIN_LIMIT || 50),
    });
    return NextResponse.json({ ok: true, summary });
  } finally {
    await store.close();
  }
}
