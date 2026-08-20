import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import {
  assertPayPalSandboxMode,
  assertSandboxPaymentsOnly,
  assertStripeTestSecret,
  capturePayPalOrder,
  createCommerceStore,
  createPayPalCheckoutOrder,
  createPendingOrder,
  createSandboxStubCheckout,
  createStripeCheckoutSession,
  expirePendingOrders,
  getCustomerOrder,
  interimCommercePolicy,
  listCustomerOrders,
  normalizeCheckoutProvider,
  PENDING_ORDER_TTL_MS,
  processPayPalWebhook,
  processStripeWebhook,
  quoteRetailCart,
  sandboxCheckoutStubEnabled,
  STRIPE_FETCH_TIMEOUT_MS,
  verifyPayPalWebhookSignature,
  verifyStripeSignature,
  ZERO_MONEY_USD,
} from "../src/lib/commerce-core.mjs";

async function withStores(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-commerce-"));
  const dbPath = join(directory, "sachviet.sqlite");
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const commerce = await createCommerceStore({ dbPath, log: () => {}, clock: () => 1000 });
  try { return await run({ catalog, commerce }); } finally { await commerce.close(); await catalog.close(); rmSync(directory, { recursive: true, force: true }); }
}

async function fixture(catalog) {
  await createCategory(catalog, { slug: "books", name: "Books" });
  const product = await createProduct(catalog, { categorySlug: "books", slug: "book", title: "A Book" });
  return { user: { id: "customer-1", role: "customer" }, offer: await writeVendorOffer(catalog, { id: "vendor-1", role: "vendor" }, { productId: product.id, vendorId: "vendor-1", priceUsd: "12.50", stockQuantity: 2 }) };
}

test("checkout snapshots an eligible offer and preserves cart add-ons", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = await fixture(catalog);
  const order = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 2, plasticCover: true, giftWrap: true }]);
  assert.equal(order.subtotalUsd, "25.0000");
  assert.equal(order.taxUsd, ZERO_MONEY_USD);
  assert.equal(order.shippingUsd, ZERO_MONEY_USD);
  assert.equal(order.totalUsd, "25.0000");
  assert.equal(order.reservationTtlMs, PENDING_ORDER_TTL_MS);
  assert.equal(order.returnsPolicy, "deferred");
  const item = await commerce.db.prepare("SELECT unit_price_usd, quantity, plastic_cover, gift_wrap FROM order_items WHERE order_id = ?").get(order.id);
  assert.equal(item.unit_price_usd, "12.5000");
  assert.equal(item.quantity, 2);
  assert.equal(item.plastic_cover, 1);
  assert.equal(item.gift_wrap, 1);
  assert.equal((await catalog.db.prepare("SELECT stock_quantity FROM vendor_offers WHERE id = ?").get(offer.id)).stock_quantity, 0);
}));

test("quoteRetailCart returns interim zero tax/shipping without reserving stock", async () => withStores(async ({ catalog, commerce }) => {
  const { offer } = await fixture(catalog);
  const quote = await quoteRetailCart(commerce, [{ vendorOfferId: offer.id, quantity: 2, plasticCover: true }]);
  assert.equal(quote.currency, "USD");
  assert.equal(quote.subtotalUsd, "25.0000");
  assert.equal(quote.taxUsd, ZERO_MONEY_USD);
  assert.equal(quote.shippingUsd, ZERO_MONEY_USD);
  assert.equal(quote.totalUsd, "25.0000");
  assert.equal(quote.reservationTtlMs, PENDING_ORDER_TTL_MS);
  assert.equal(quote.policy.paymentsMode, "sandbox");
  assert.equal(quote.policy.returnsPolicy, "deferred");
  assert.equal(quote.lines.length, 1);
  assert.equal(quote.lines[0].title, "A Book");
  assert.equal(quote.lines[0].stockAvailable, 2);
  assert.equal((await catalog.db.prepare("SELECT stock_quantity FROM vendor_offers WHERE id = ?").get(offer.id)).stock_quantity, 2);
  assert.deepEqual(interimCommercePolicy().taxUsd, ZERO_MONEY_USD);
  await assert.rejects(() => quoteRetailCart(commerce, []), /Cart cannot be empty/);
  await assert.rejects(() => quoteRetailCart(commerce, [{ vendorOfferId: "missing", quantity: 1 }]), /no longer available/);
}));

test("customer order detail exposes expiresAt and interim totals", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = await fixture(catalog);
  const pending = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  const detail = await getCustomerOrder(commerce, user, pending.id);
  assert.equal(detail.expiresAt, pending.expiresAt);
  assert.equal(detail.taxUsd, ZERO_MONEY_USD);
  assert.equal(detail.shippingUsd, ZERO_MONEY_USD);
  assert.equal(detail.totalUsd, pending.subtotalUsd);
  assert.equal(detail.returnsPolicy, "deferred");
  const listed = await listCustomerOrders(commerce, user, { limit: 10 });
  assert.equal(listed.items[0].expiresAt, pending.expiresAt);
}));

test("checkout rejects unavailable offers and invalid cart quantities", async () => withStores(async ({ catalog, commerce }) => {
  const { user } = await fixture(catalog);
  await assert.rejects(async () => await createPendingOrder(commerce, user, [{ vendorOfferId: "missing", quantity: 1 }]), /no longer available/);
  await assert.rejects(async () => await createPendingOrder(commerce, user, [{ vendorOfferId: "missing", quantity: 0 }]), /between 1 and 99/);
}));

test("Stripe checkout requires environment configuration and saves its hosted URL", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = await fixture(catalog);
  const order = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await assert.rejects(() => createStripeCheckoutSession(commerce, order.id, {}), /not configured/);
  let fetchOptions;
  let fetchBody;
  const session = await createStripeCheckoutSession(
    commerce,
    order.id,
    { STRIPE_SECRET_KEY: "sk_test_example", STRIPE_SUCCESS_URL: "https://example.test/success", STRIPE_CANCEL_URL: "https://example.test/cancel" },
    async (_url, options) => {
      fetchOptions = options;
      fetchBody = String(options?.body || "");
      return new Response(JSON.stringify({ id: "cs_test_1", url: "https://checkout.stripe.test/session" }), { status: 200 });
    },
  );
  assert.deepEqual(session, { id: "cs_test_1", url: "https://checkout.stripe.test/session", provider: "stripe" });
  assert.equal((await commerce.db.prepare("SELECT checkout_url, payment_provider FROM orders WHERE id = ?").get(order.id)).checkout_url, session.url);
  assert.equal((await commerce.db.prepare("SELECT payment_provider FROM orders WHERE id = ?").get(order.id)).payment_provider, "stripe");
  assert.ok(fetchOptions?.signal instanceof AbortSignal);
  assert.ok(STRIPE_FETCH_TIMEOUT_MS >= 1_000);
  assert.match(fetchBody, /unit_amount%5D=1250/);
  assert.doesNotMatch(fetchBody, /unit_amount_decimal/);
}));

test("Stripe checkout refuses live secret keys", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = await fixture(catalog);
  const order = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await assert.rejects(() => createStripeCheckoutSession(commerce, order.id, {
      STRIPE_SECRET_KEY: "sk_live_forbidden",
      STRIPE_SUCCESS_URL: "https://example.test/success",
      STRIPE_CANCEL_URL: "https://example.test/cancel",
    }),
    /test-mode/,
  );
  assert.throws(() => assertStripeTestSecret("sk_live_x"), /test-mode/);
}));

test("normalizeCheckoutProvider defaults to stripe and rejects unknown", async () => {
  assert.equal(normalizeCheckoutProvider(undefined), "stripe");
  assert.equal(normalizeCheckoutProvider("PayPal"), "paypal");
  assert.throws(() => normalizeCheckoutProvider("square"), /stripe or paypal/);
  assert.throws(() => normalizeCheckoutProvider("stub"), /stripe or paypal/);
  assert.equal(normalizeCheckoutProvider("stub", { allowStub: true }), "stub");
});

test("sandbox checkout stub is local-only and refuses live payment keys", async () => withStores(async ({ catalog, commerce }) => {
  assert.equal(sandboxCheckoutStubEnabled({}), false);
  assert.equal(sandboxCheckoutStubEnabled({ TEST_HOOKS_ENABLED: "1" }), true);
  assert.equal(sandboxCheckoutStubEnabled({ CHECKOUT_SANDBOX_STUB: "1" }), true);
  assert.equal(sandboxCheckoutStubEnabled({ CHECKOUT_SANDBOX_STUB: "1", VERCEL: "1" }), false);
  assert.equal(sandboxCheckoutStubEnabled({ CHECKOUT_SANDBOX_STUB: "1", VERCEL_ENV: "production" }), false);
  assert.throws(() => assertSandboxPaymentsOnly({ STRIPE_SECRET_KEY: "sk_live_forbidden" }), /Live Stripe/);
  assert.throws(() => assertSandboxPaymentsOnly({ PAYPAL_MODE: "live" }), /PAYPAL_MODE=sandbox/);

  const { user, offer } = await fixture(catalog);
  const order = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await assert.rejects(
    () => createSandboxStubCheckout(commerce, order.id, {}),
    /not enabled/,
  );
  await assert.rejects(
    () => createSandboxStubCheckout(commerce, order.id, { CHECKOUT_SANDBOX_STUB: "1", STRIPE_SECRET_KEY: "sk_live_x" }),
    /Live Stripe/,
  );
  const session = await createSandboxStubCheckout(commerce, order.id, { CHECKOUT_SANDBOX_STUB: "1" });
  assert.equal(session.provider, "stub");
  assert.equal(session.url, `/ecom/orders/${order.id}`);
  const row = await commerce.db.prepare("SELECT payment_provider, checkout_url, status FROM orders WHERE id = ?").get(order.id);
  assert.equal(row.payment_provider, "stub");
  assert.equal(row.status, "pending_payment");
  assert.equal(row.checkout_url, session.url);
}));

test("PayPal checkout requires sandbox config and saves approve URL", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = await fixture(catalog);
  const order = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await assert.rejects(() => createPayPalCheckoutOrder(commerce, order.id, {}), /not configured/);
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
  const row = await commerce.db.prepare("SELECT payment_provider, paypal_order_id, checkout_url FROM orders WHERE id = ?").get(order.id);
  assert.equal(row.payment_provider, "paypal");
  assert.equal(row.paypal_order_id, "PAYPAL-ORDER-1");
  assert.equal(row.checkout_url, session.url);
  assert.equal(calls.length, 2);
}));

test("PayPal capture marks pending order paid idempotently", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = await fixture(catalog);
  const order = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await commerce.db
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
  assert.equal((await listCustomerOrders(commerce, user)).items[0].status, "paid");
  const second = await capturePayPalOrder(commerce, "PAYPAL-ORDER-2", env, fetcher);
  assert.equal(second.updated, false);
  assert.equal(second.paid, true);
}));

test("PayPal webhook verifies via API then captures on ORDER.APPROVED", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = await fixture(catalog);
  const order = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await commerce.db
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
  assert.equal((await listCustomerOrders(commerce, user)).items[0].status, "paid");
}));

test("signed Stripe completion updates only the referenced pending order", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = await fixture(catalog);
  const order = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  const secret = "whsec_test_secret_value";
  const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_test_1", metadata: { order_id: order.id } } } });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex")}`;
  assert.equal(verifyStripeSignature(payload, signature, secret), true);
  assert.deepEqual(await processStripeWebhook(commerce, payload, signature, secret), {
    handled: true,
    updated: true,
    paid: true,
    enqueued: true,
    orderId: order.id,
  });
  assert.equal((await listCustomerOrders(commerce, user)).items[0].status, "paid");
  assert.deepEqual(await processStripeWebhook(commerce, payload, signature, secret), {
    handled: true,
    updated: false,
    paid: true,
    enqueued: false,
    orderId: order.id,
  });
  assert.equal((await listCustomerOrders(commerce, user)).items[0].status, "paid");
  await assert.rejects(async () => await processStripeWebhook(commerce, payload, "t=1,v1=bad", secret), /signature/);
  await assert.rejects(async () => await processStripeWebhook(commerce, payload, signature, undefined), /signature/);
  await assert.rejects(async () => await processStripeWebhook(commerce, payload, signature, "short"), /signature/);
}));

test("Stripe checkout rejects missing success or cancel URLs even when secret is set", async () => withStores(async ({ catalog, commerce }) => {
  const { user, offer } = await fixture(catalog);
  const order = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  await assert.rejects(() => createStripeCheckoutSession(commerce, order.id, { STRIPE_SECRET_KEY: "sk_test_example" }),
    /not configured/,
  );
  await assert.rejects(() => createStripeCheckoutSession(commerce, order.id, {
      STRIPE_SECRET_KEY: "sk_test_example",
      STRIPE_SUCCESS_URL: "https://example.test/success",
    }),
    /not configured/,
  );
}));

function signedStripePaidPayload(orderId, secret = "whsec_test_secret_value") {
  const payload = JSON.stringify({
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_expired", metadata: { order_id: orderId } } },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex")}`;
  return { payload, signature, secret };
}

test("last-unit checkout expires, restocks, and a second buyer can purchase", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-commerce-expire-"));
  const dbPath = join(directory, "sachviet.sqlite");
  let currentTime = 1_000;
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const commerce = await createCommerceStore({
    dbPath,
    log: () => {},
    clock: () => currentTime,
    pendingOrderTtlMs: 60_000,
  });
  try {
    await createCategory(catalog, { slug: "books", name: "Books" });
    const product = await createProduct(catalog, { categorySlug: "books", slug: "book", title: "A Book" });
    const offer = await writeVendorOffer(catalog, { id: "vendor-1", role: "vendor" }, {
      productId: product.id,
      vendorId: "vendor-1",
      priceUsd: "12.50",
      stockQuantity: 1,
    });
    const firstBuyer = { id: "customer-1", role: "customer" };
    const secondBuyer = { id: "customer-2", role: "customer" };
    const pending = await createPendingOrder(commerce, firstBuyer, [{ vendorOfferId: offer.id, quantity: 1 }]);
    assert.equal(pending.status, "pending_payment");
    assert.equal(pending.expiresAt, 61_000);
    assert.equal((await catalog.db.prepare("SELECT stock_quantity FROM vendor_offers WHERE id = ?").get(offer.id)).stock_quantity, 0);
    await assert.rejects(
      () => createPendingOrder(commerce, secondBuyer, [{ vendorOfferId: offer.id, quantity: 1 }]),
      /no longer available/,
    );

    currentTime = 61_000;
    const expired = await expirePendingOrders(commerce);
    assert.equal(expired.expired, 1);
    assert.equal((await commerce.db.prepare("SELECT status FROM orders WHERE id = ?").get(pending.id)).status, "payment_failed");
    assert.equal((await catalog.db.prepare("SELECT stock_quantity FROM vendor_offers WHERE id = ?").get(offer.id)).stock_quantity, 1);
    const restock = await commerce.db
      .prepare("SELECT delta, reason FROM inventory_movements WHERE order_id = ? AND reason = 'expire_restock'")
      .get(pending.id);
    assert.equal(restock.delta, 1);

    const second = await createPendingOrder(commerce, secondBuyer, [{ vendorOfferId: offer.id, quantity: 1 }]);
    assert.equal(second.status, "pending_payment");
    assert.equal((await catalog.db.prepare("SELECT stock_quantity FROM vendor_offers WHERE id = ?").get(offer.id)).stock_quantity, 0);

    const signed = signedStripePaidPayload(pending.id);
    const webhook = await processStripeWebhook(commerce, signed.payload, signed.signature, signed.secret);
    assert.equal(webhook.rejected, true);
    assert.equal(webhook.paid, false);
    assert.equal(webhook.updated, false);
    assert.equal((await commerce.db.prepare("SELECT status FROM orders WHERE id = ?").get(pending.id)).status, "payment_failed");
    assert.equal((await catalog.db.prepare("SELECT stock_quantity FROM vendor_offers WHERE id = ?").get(offer.id)).stock_quantity, 0);
    assert.equal((await expirePendingOrders(commerce)).expired, 0);
  } finally {
    await commerce.close();
    await catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
