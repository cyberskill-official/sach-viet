import { NextResponse } from "next/server";
import {
  createCommerceStore,
  processStripeWebhook,
  STRIPE_WEBHOOK_MAX_BODY_BYTES,
} from "@/lib/commerce-core.mjs";
import { processOrderCommsOutbox } from "@/lib/order-comms-core.mjs";

async function readStripeWebhookBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > STRIPE_WEBHOOK_MAX_BODY_BYTES) {
    throw new Error("webhook_payload_too_large");
  }

  const payload = await request.text();
  // UTF-16 code units ≈ bytes for Stripe's ASCII/JSON payloads; length check still caps abuse.
  if (payload.length > STRIPE_WEBHOOK_MAX_BODY_BYTES) {
    throw new Error("webhook_payload_too_large");
  }
  return payload;
}

export async function POST(request: Request) {
  let payload: string;
  try {
    payload = await readStripeWebhookBody(request);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "webhook_body_rejected";
    console.error(JSON.stringify({ event: "stripe_webhook_body_rejected", result: "failed", reason }));
    const status = reason === "webhook_payload_too_large" ? 413 : 400;
    return NextResponse.json({ error: "Webhook rejected." }, { status });
  }

  const store = await createCommerceStore();
  try {
    let result;
    try {
      result = await processStripeWebhook(
        store,
        payload,
        request.headers.get("stripe-signature"),
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "stripe_webhook_rejected",
          result: "failed",
          reason: error instanceof Error ? error.message : "webhook_rejected",
        }),
      );
      // Only rejections before the paid transition reach here, so a retry is still useful.
      return NextResponse.json({ error: "Webhook rejected." }, { status: 400 });
    }

    let comms = null;
    if (result.handled && result.orderId) {
      try {
        // Replays drain whatever the outbox still owes, independent of `result.updated`.
        comms = await processOrderCommsOutbox(store, { orderId: result.orderId });
      } catch (error) {
        // The order is already paid and the confirmation is durably queued; answering 400 here
        // would make Stripe retry an event that can no longer re-trigger delivery.
        console.error(
          JSON.stringify({
            event: "order_comms_outbox_dispatch_failed",
            result: "failed",
            order_id: result.orderId,
            reason: error instanceof Error ? error.message : "outbox_dispatch_failed",
          }),
        );
        store.log("order_comms_outbox_dispatch_failed", {
          result: "failed",
          order_id: result.orderId,
          reason: error instanceof Error ? error.message : "outbox_dispatch_failed",
        });
      }
    }
    return NextResponse.json({ ...result, comms });
  } finally {
    await store.close();
  }
}
