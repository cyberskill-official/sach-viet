import { NextResponse } from "next/server";
import {
  createCommerceStore,
  PAYPAL_WEBHOOK_MAX_BODY_BYTES,
  processPayPalWebhook,
} from "@/lib/commerce-core.mjs";
import { processOrderCommsOutbox } from "@/lib/order-comms-core.mjs";

async function readPayPalWebhookBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > PAYPAL_WEBHOOK_MAX_BODY_BYTES) {
    throw new Error("webhook_payload_too_large");
  }
  const payload = await request.text();
  if (payload.length > PAYPAL_WEBHOOK_MAX_BODY_BYTES) {
    throw new Error("webhook_payload_too_large");
  }
  return payload;
}

export async function POST(request: Request) {
  let payload: string;
  try {
    payload = await readPayPalWebhookBody(request);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "webhook_body_rejected";
    console.error(JSON.stringify({ event: "paypal_webhook_body_rejected", result: "failed", reason }));
    const status = reason === "webhook_payload_too_large" ? 413 : 400;
    return NextResponse.json({ error: "Webhook rejected." }, { status });
  }

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    return NextResponse.json({ error: "PayPal webhook is not configured." }, { status: 503 });
  }

  const store = await createCommerceStore();
  try {
    let result;
    try {
      result = await processPayPalWebhook(store, payload, request.headers, webhookId);
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "paypal_webhook_rejected",
          result: "failed",
          reason: error instanceof Error ? error.message : "webhook_rejected",
        }),
      );
      return NextResponse.json({ error: "Webhook rejected." }, { status: 400 });
    }

    if ("rejected" in result && result.rejected) {
      return NextResponse.json(
        {
          error: { code: "order_expired", message: "Order is no longer payable.", requestId: result.orderId },
          ...result,
        },
        { status: 409 },
      );
    }

    let comms: unknown = null;
    if (result.handled && "orderId" in result && result.orderId) {
      try {
        comms = await processOrderCommsOutbox(store, { orderId: String(result.orderId) });
      } catch (error) {
        console.error(
          JSON.stringify({
            event: "order_comms_outbox_dispatch_failed",
            result: "failed",
            order_id: result.orderId,
            provider: "paypal",
            reason: error instanceof Error ? error.message : "outbox_dispatch_failed",
          }),
        );
      }
    }
    return NextResponse.json({ ...result, comms });
  } finally {
    await store.close();
  }
}
