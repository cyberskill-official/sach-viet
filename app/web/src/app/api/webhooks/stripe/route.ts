import { NextResponse } from "next/server";
import { createCommerceStore, processStripeWebhook } from "@/lib/commerce-core.mjs";
import { dispatchOrderPaidConfirmation } from "@/lib/order-comms-core.mjs";

export async function POST(request: Request) {
  const payload = await request.text();
  const store = createCommerceStore();
  try {
    const result = processStripeWebhook(store, payload, request.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
    if (result.handled && result.updated && result.orderId) {
      dispatchOrderPaidConfirmation(store, result.orderId);
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Webhook rejected." }, { status: 400 });
  } finally {
    store.close();
  }
}
