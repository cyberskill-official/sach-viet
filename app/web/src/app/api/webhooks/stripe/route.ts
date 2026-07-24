import { NextResponse } from "next/server";
import { createCommerceStore, processStripeWebhook } from "@/lib/commerce-core.mjs";

export async function POST(request: Request) {
  const payload = await request.text();
  const store = createCommerceStore();
  try { return NextResponse.json(processStripeWebhook(store, payload, request.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET)); }
  catch { return NextResponse.json({ error: "Webhook rejected." }, { status: 400 }); }
  finally { store.close(); }
}
