import { NextResponse } from "next/server";
import { createCommerceStore, processStripeWebhook } from "@/lib/commerce-core.mjs";
import { processOrderCommsOutbox } from "@/lib/order-comms-core.mjs";

export async function POST(request: Request) {
  const payload = await request.text();
  const store = createCommerceStore();
  try {
    let result;
    try {
      result = processStripeWebhook(store, payload, request.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      // Only rejections before the paid transition reach here, so a retry is still useful.
      return NextResponse.json({ error: "Webhook rejected." }, { status: 400 });
    }

    let comms = null;
    if (result.handled && result.orderId) {
      try {
        // Replays drain whatever the outbox still owes, independent of `result.updated`.
        comms = processOrderCommsOutbox(store, { orderId: result.orderId });
      } catch (error) {
        // The order is already paid and the confirmation is durably queued; answering 400 here
        // would make Stripe retry an event that can no longer re-trigger delivery.
        store.log("order_comms_outbox_dispatch_failed", {
          result: "failed",
          order_id: result.orderId,
          reason: error instanceof Error ? error.message : "outbox_dispatch_failed",
        });
      }
    }
    return NextResponse.json({ ...result, comms });
  } finally {
    store.close();
  }
}
