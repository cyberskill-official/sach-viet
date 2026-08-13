import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createCommerceStore, recordPaymentEvent } from "@/lib/commerce-core.mjs";

/**
 * Buyer return from PayPal approve. Records the return; the webhook commits paid.
 * Unauthenticated GET must not capture.
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

  const sessionToken = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  let session = null;
  try {
    session = await readSession(await getAuthStore(), sessionToken, process.env.AUTH_SESSION_SECRET);
  } catch {
    session = null;
  }
  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", `${url.pathname}${url.search}`);
    return NextResponse.redirect(login);
  }

  const store = await createCommerceStore();
  try {
    const local = await store.db
      .prepare("SELECT id, user_id, status FROM orders WHERE paypal_order_id = ?")
      .get(token);
    if (!local || local.user_id !== session.user.id) {
      return NextResponse.redirect(new URL(cartPath, request.url));
    }
    await recordPaymentEvent(store, {
      provider: "paypal",
      providerEventId: `return:${token}`,
      orderId: local.id,
      payload: JSON.stringify({ source: "buyer_return", paypalOrderId: token }),
    });
    return NextResponse.redirect(new URL(ordersPath, request.url));
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "paypal_return_recorded_failed",
        result: "failed",
        reason: error instanceof Error ? error.message : "return_failed",
      }),
    );
    return NextResponse.redirect(new URL(cartPath, request.url));
  } finally {
    await store.close();
  }
}
