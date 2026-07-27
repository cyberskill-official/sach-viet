import { NextResponse } from "next/server";
import { capturePayPalOrder, createCommerceStore } from "@/lib/commerce-core.mjs";
import { processOrderCommsOutbox } from "@/lib/order-comms-core.mjs";

/**
 * Buyer return from PayPal approve — capture then redirect to orders.
 * Accepts token (PayPal order id) as query param (PayPal default).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || url.searchParams.get("paypal_order_id");
  const cancel = url.searchParams.get("cancel") === "1";
  const ordersPath = "/ecom/orders?paid=1";
  const cartPath = "/ecom/cart";

  if (cancel || !token) {
    return NextResponse.redirect(new URL(cartPath, request.url));
  }

  const store = createCommerceStore();
  try {
    const result = await capturePayPalOrder(store, token);
    if (result.orderId) {
      try {
        processOrderCommsOutbox(store, { orderId: result.orderId });
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
    if (!result.paid) {
      return NextResponse.redirect(new URL(cartPath, request.url));
    }
    return NextResponse.redirect(new URL(ordersPath, request.url));
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "paypal_return_capture_failed",
        result: "failed",
        reason: error instanceof Error ? error.message : "capture_failed",
      }),
    );
    return NextResponse.redirect(new URL(cartPath, request.url));
  } finally {
    store.close();
  }
}
