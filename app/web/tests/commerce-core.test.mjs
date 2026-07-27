import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import {
  assertPayPalSandboxMode,
  assertStripeTestSecret,
  capturePayPalOrder,
  createCommerceStore,
  createPayPalCheckoutOrder,
  createPendingOrder,
  createStripeCheckoutSession,
  listCustomerOrders,
  normalizeCheckoutProvider,
  processPayPalWebhook,
  processStripeWebhook,
  STRIPE_FETCH_TIMEOUT_MS,
  verifyPayPalWebhookSignature,
  verifyStripeSignature,
} from "../src/lib/commerce-core.mjs";

async function withStores(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-commerce-"));
  const dbPath = join(directory, "sachviet.sqlite");
  const catalog = createCatalogStore({ dbPath, log: () => {} });
  const commerce = createCommerceStore({ dbPath, log: () => {}, clock: () => 1000 });
  try { return await run({ catalog, commerce }); } finally { commerce.close(); catalog.close(); rmSync(directory, { recursive: true, force: true }); }
}

function fixture(catalog) {
  createCategory(catalog, { slug: "books", name: "Books" });
  const product = createProduct(catalog, { categorySlug: "books", slug: "book", title: "A Book" });
  return { user: { id: "customer-1", role: "customer" }, offer: writeVendorOffer(catalog, { id: "vendor-1", role: "vendor" }, { productId: product.id, vendorId: "vendor-1", priceUsd: "12.50", stockQuantity: 2 }) };
}

test("checkout snapshots an eligible offer and preserves cart add-ons", () => withStores(({ catalog, commerce }) => {
  const { user, offer } = fixture(catalog);
  const order = createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 2, plasticCover: true, giftWrap: true }]);
  assert.equal(order.subtotalUsd, "25.0000");
  const item = commerce.db.prepare("SELECT unit_price_usd, quantity, plastic_cover, gift_wrap FROM order_items WHERE order_id = ?").get(order.id);
  assert.equal(item.unit_price_usd, "12.5000");
  assert.equal(item.quantity, 2);
  assert.equal(item.plastic_cover, 1);
  assert.equal(item.gift_wrap, 1);
}));

test("checkout rejects unavailable offers and invalid cart quantities", () => withStores(({ catalog, commerce }) => {
  const { user } = fixture(catalog);
  assert.throws(() => createPendingOrder(commerce, user, [{ vendorOfferId: "missing", quantity: 1 }]), /no longer available/);
  assert.throws(() => createPendingOrder(commerce, user, [{ vendorOfferId: "missing", quantity: 0 }]), /between 1 and 99/);
}));

test("Stripe checkout requires environment configuration and saves its hosted URL", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = fixture(catalog);
  const order = createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await assert.rejects(createStripeCheckoutSession(commerce, order.id, {}), /not configured/);
  let fetchOptions;
  const session = await createStripeCheckoutSession(
    commerce,
    order.id,
    { STRIPE_SECRET_KEY: "sk_test_example", STRIPE_SUCCESS_URL: "https://example.test/success", STRIPE_CANCEL_URL: "https://example.test/cancel" },
    async (_url, options) => {
      fetchOptions = options;
      return new Response(JSON.stringify({ id: "cs_test_1", url: "https://checkout.stripe.test/session" }), { status: 200 });
    },
  );
  assert.deepEqual(session, { id: "cs_test_1", url: "https://checkout.stripe.test/session", provider: "stripe" });
  assert.equal(commerce.db.prepare("SELECT checkout_url, payment_provider FROM orders WHERE id = ?").get(order.id).checkout_url, session.url);
  assert.equal(commerce.db.prepare("SELECT payment_provider FROM orders WHERE id = ?").get(order.id).payment_provider, "stripe");
  assert.ok(fetchOptions?.signal instanceof AbortSignal);
  assert.ok(STRIPE_FETCH_TIMEOUT_MS >= 1_000);
}));

test("Stripe checkout refuses live secret keys", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = fixture(catalog);
  const order = createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await assert.rejects(
    createStripeCheckoutSession(commerce, order.id, {
      STRIPE_SECRET_KEY: "sk_live_forbidden",
      STRIPE_SUCCESS_URL: "https://example.test/success",
      STRIPE_CANCEL_URL: "https://example.test/cancel",
    }),
    /test-mode/,
  );
  assert.throws(() => assertStripeTestSecret("sk_live_x"), /test-mode/);
}));

test("normalizeCheckoutProvider defaults to stripe and rejects unknown", () => {
  assert.equal(normalizeCheckoutProvider(undefined), "stripe");
  assert.equal(normalizeCheckoutProvider("PayPal"), "paypal");
  assert.throws(() => normalizeCheckoutProvider("square"), /stripe or paypal/);
});

test("PayPal checkout requires sandbox config and saves approve URL", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = fixture(catalog);
  const order = createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await assert.rejects(createPayPalCheckoutOrder(commerce, order.id, {}), /not configured/);
  assert.throws(() => assertPayPalSandboxMode({ PAYPAL_MODE: "live" }), /refused|sandbox/);
  const calls = [];
  const session = await createPayPalCheckoutOrder(
    commerce,
    order.id,
    {
      PAYPAL_MODE: "sandbox",
      PAYPAL_CLIENT_ID: "client",
      PAYPAL_CLIENT_SECRET: "secret",
      PAYPAL_RETURN_URL: "https://example.test/api/checkout/paypal/return",
      PAYPAL_CANCEL_URL: "https://example.test/ecom/cart",
    },
    async (url, options) => {
      calls.push({ url, method: options?.method });
      if (String(url).includes("/v1/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "tok_test" }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          id: "PAYPAL-ORDER-1",
          links: [{ rel: "approve", href: "https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-1" }],
        }),
        { status: 201 },
      );
    },
  );
  assert.deepEqual(session, {
    id: "PAYPAL-ORDER-1",
    url: "https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-1",
    provider: "paypal",
  });
  const row = commerce.db.prepare("SELECT payment_provider, paypal_order_id, checkout_url FROM orders WHERE id = ?").get(order.id);
  assert.equal(row.payment_provider, "paypal");
  assert.equal(row.paypal_order_id, "PAYPAL-ORDER-1");
  assert.equal(row.checkout_url, session.url);
  assert.equal(calls.length, 2);
}));

test("PayPal capture marks pending order paid idempotently", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = fixture(catalog);
  const order = createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  commerce.db
    .prepare("UPDATE orders SET payment_provider = 'paypal', paypal_order_id = ? WHERE id = ?")
    .run("PAYPAL-ORDER-2", order.id);
  const env = {
    PAYPAL_MODE: "sandbox",
    PAYPAL_CLIENT_ID: "client",
    PAYPAL_CLIENT_SECRET: "secret",
  };
  const fetcher = async (url) => {
    if (String(url).includes("/v1/oauth2/token")) {
      return new Response(JSON.stringify({ access_token: "tok_test" }), { status: 200 });
    }
    return new Response(JSON.stringify({ status: "COMPLETED", id: "PAYPAL-ORDER-2" }), { status: 201 });
  };
  const first = await capturePayPalOrder(commerce, "PAYPAL-ORDER-2", env, fetcher);
  assert.equal(first.updated, true);
  assert.equal(first.paid, true);
  assert.equal(listCustomerOrders(commerce, user)[0].status, "paid");
  const second = await capturePayPalOrder(commerce, "PAYPAL-ORDER-2", env, fetcher);
  assert.equal(second.updated, false);
  assert.equal(second.paid, true);
}));

test("PayPal webhook verifies via API then captures on ORDER.APPROVED", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = fixture(catalog);
  const order = createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  commerce.db
    .prepare("UPDATE orders SET payment_provider = 'paypal', paypal_order_id = ? WHERE id = ?")
    .run("PAYPAL-ORDER-3", order.id);
  const payload = JSON.stringify({
    event_type: "CHECKOUT.ORDER.APPROVED",
    resource: { id: "PAYPAL-ORDER-3" },
  });
  const headers = {
    "paypal-transmission-id": "tx-1",
    "paypal-transmission-time": "2026-07-28T00:00:00Z",
    "paypal-cert-url": "https://api.paypal.com/cert",
    "paypal-auth-algo": "SHA256withRSA",
    "paypal-transmission-sig": "sig",
  };
  const env = {
    PAYPAL_MODE: "sandbox",
    PAYPAL_CLIENT_ID: "client",
    PAYPAL_CLIENT_SECRET: "secret",
  };
  const fetcher = async (url) => {
    if (String(url).includes("/v1/oauth2/token")) {
      return new Response(JSON.stringify({ access_token: "tok_test" }), { status: 200 });
    }
    if (String(url).includes("/v1/notifications/verify-webhook-signature")) {
      return new Response(JSON.stringify({ verification_status: "SUCCESS" }), { status: 200 });
    }
    return new Response(JSON.stringify({ status: "COMPLETED", id: "PAYPAL-ORDER-3" }), { status: 201 });
  };
  assert.equal(await verifyPayPalWebhookSignature(payload, headers, "WH-TEST-ID-1", env, fetcher), true);
  const result = await processPayPalWebhook(commerce, payload, headers, "WH-TEST-ID-1", env, fetcher);
  assert.equal(result.handled, true);
  assert.equal(result.paid, true);
  assert.equal(listCustomerOrders(commerce, user)[0].status, "paid");
}));

test("signed Stripe completion updates only the referenced pending order", () => withStores(({ catalog, commerce }) => {
  const { user, offer } = fixture(catalog);
  const order = createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  const secret = "whsec_test_secret_value";
  const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_test_1", metadata: { order_id: order.id } } } });
  const timestamp = "1700000000";
  const signature = `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex")}`;
  assert.equal(verifyStripeSignature(payload, signature, secret), true);
  assert.deepEqual(processStripeWebhook(commerce, payload, signature, secret), {
    handled: true,
    updated: true,
    paid: true,
    enqueued: true,
    orderId: order.id,
  });
  assert.equal(listCustomerOrders(commerce, user)[0].status, "paid");
  assert.deepEqual(processStripeWebhook(commerce, payload, signature, secret), {
    handled: true,
    updated: false,
    paid: true,
    enqueued: false,
    orderId: order.id,
  });
  assert.equal(listCustomerOrders(commerce, user)[0].status, "paid");
  assert.throws(() => processStripeWebhook(commerce, payload, "t=1,v1=bad", secret), /signature/);
  assert.throws(() => processStripeWebhook(commerce, payload, signature, undefined), /signature/);
  assert.throws(() => processStripeWebhook(commerce, payload, signature, "short"), /signature/);
}));

test("Stripe checkout rejects missing success or cancel URLs even when secret is set", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = fixture(catalog);
  const order = createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await assert.rejects(
    createStripeCheckoutSession(commerce, order.id, { STRIPE_SECRET_KEY: "sk_test_example" }),
    /not configured/,
  );
  await assert.rejects(
    createStripeCheckoutSession(commerce, order.id, {
      STRIPE_SECRET_KEY: "sk_test_example",
      STRIPE_SUCCESS_URL: "https://example.test/success",
    }),
    /not configured/,
  );
}));
