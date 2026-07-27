import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("commerce routes use signed sessions and Stripe/PayPal checkout + webhooks", () => {
  const checkout = readFileSync(resolve(root, "src/app/api/checkout/route.ts"), "utf8");
  const webhook = readFileSync(resolve(root, "src/app/api/webhooks/stripe/route.ts"), "utf8");
  const paypalWebhook = readFileSync(resolve(root, "src/app/api/webhooks/paypal/route.ts"), "utf8");
  const paypalReturn = readFileSync(resolve(root, "src/app/api/checkout/paypal/return/route.ts"), "utf8");
  const orders = readFileSync(resolve(root, "src/app/api/orders/route.ts"), "utf8");
  const cart = readFileSync(resolve(root, "src/components/cart-panel.tsx"), "utf8");
  assert.match(checkout, /readSession/);
  assert.match(checkout, /createStripeCheckoutSession/);
  assert.match(checkout, /createPayPalCheckoutOrder/);
  assert.match(checkout, /normalizeCheckoutProvider/);
  assert.match(webhook, /STRIPE_WEBHOOK_MAX_BODY_BYTES/);
  assert.match(webhook, /request\.text/);
  assert.match(webhook, /processStripeWebhook/);
  assert.match(webhook, /processOrderCommsOutbox/);
  assert.match(webhook, /console\.error/);
  assert.match(paypalWebhook, /processPayPalWebhook/);
  assert.match(paypalWebhook, /PAYPAL_WEBHOOK_MAX_BODY_BYTES/);
  assert.match(paypalReturn, /capturePayPalOrder/);
  assert.match(orders, /listCustomerOrders/);
  assert.match(cart, /localStorage/);
  assert.match(cart, /plasticCover/);
  assert.match(cart, /giftWrap/);
  assert.match(cart, /Thanh toán Stripe/);
  assert.match(cart, /Thanh toán PayPal/);
  assert.match(cart, /provider/);
});
