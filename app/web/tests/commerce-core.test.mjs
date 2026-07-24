import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import { createCommerceStore, createPendingOrder, createStripeCheckoutSession, listCustomerOrders, processStripeWebhook, verifyStripeSignature } from "../src/lib/commerce-core.mjs";

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
  const session = await createStripeCheckoutSession(commerce, order.id, { STRIPE_SECRET_KEY: "sk_test_example", STRIPE_SUCCESS_URL: "https://example.test/success", STRIPE_CANCEL_URL: "https://example.test/cancel" }, async () => new Response(JSON.stringify({ id: "cs_test_1", url: "https://checkout.stripe.test/session" }), { status: 200 }));
  assert.deepEqual(session, { id: "cs_test_1", url: "https://checkout.stripe.test/session" });
  assert.equal(commerce.db.prepare("SELECT checkout_url FROM orders WHERE id = ?").get(order.id).checkout_url, session.url);
}));

test("signed Stripe completion updates only the referenced pending order", () => withStores(({ catalog, commerce }) => {
  const { user, offer } = fixture(catalog);
  const order = createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
  const secret = "whsec_test_secret_value";
  const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_test_1", metadata: { order_id: order.id } } } });
  const timestamp = "1700000000";
  const signature = `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex")}`;
  assert.equal(verifyStripeSignature(payload, signature, secret), true);
  assert.deepEqual(processStripeWebhook(commerce, payload, signature, secret), { handled: true, updated: true });
  assert.equal(listCustomerOrders(commerce, user)[0].status, "paid");
  assert.throws(() => processStripeWebhook(commerce, payload, "t=1,v1=bad", secret), /signature/);
}));
