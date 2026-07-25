import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { enqueueOrderComms, ensureOrderCommsOutboxSchema } from "./order-comms-outbox-core.mjs";
import { beginImmediateWithRetry, openDatabase } from "./db.mjs";

/** Stripe Checkout Session create must fail closed rather than hang the checkout request. */
export const STRIPE_FETCH_TIMEOUT_MS = 15_000;
/** Reject oversized webhook bodies before JSON parse / signature work. */
export const STRIPE_WEBHOOK_MAX_BODY_BYTES = 64 * 1024;

function identifier() { return randomBytes(16).toString("hex"); }
function now() { return Date.now(); }
function required(value, label) { if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`); return value.trim(); }
function moneyUnits(value) { const [whole, fraction = ""] = value.split("."); return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0")); }
function moneyString(value) { return `${value / 10000n}.${String(value % 10000n).padStart(4, "0")}`; }

function defaultCommerceLog(event, fields = {}) {
  const line = JSON.stringify({ event, task_id: "TASK-REBUILD-005", ...fields });
  if (fields.result === "failed") console.error(line);
  else if (fields.result === "rejected") console.warn(line);
  else console.info(line);
}

export function createCommerceStore({ dbPath, clock = now, log = defaultCommerceLog } = {}) {
  const db = openDatabase(dbPath);
  return { db, clock, log, close: () => db.close() };
}

/** No-op: legacy columns and indexes are now applied by the initial migration. */
export function ensureCommerceLegacyColumns() {}

export function normalizeCartItem(item) {
  const quantity = Number(item?.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Cart quantity must be between 1 and 99.");
  return { vendorOfferId: required(item?.vendorOfferId, "Vendor offer ID"), quantity, plasticCover: item.plasticCover === true, giftWrap: item.giftWrap === true };
}

export function createPendingOrder(store, user, items) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cart cannot be empty.");
  const normalizedItems = items.map(normalizeCartItem);
  const order = { id: identifier(), userId: user.id, currency: "USD", subtotalUsd: 0n };
  const snapshots = normalizedItems.map((item) => {
    const offer = store.db.prepare(`SELECT vendor_offers.id, vendor_offers.product_id, vendor_offers.price_usd, products.title
      FROM vendor_offers JOIN products ON products.id = vendor_offers.product_id
      WHERE vendor_offers.id = ? AND vendor_offers.is_active = 1 AND vendor_offers.stock_quantity > 0`).get(item.vendorOfferId);
    if (!offer) throw new Error("One cart offer is no longer available.");
    order.subtotalUsd += moneyUnits(offer.price_usd) * BigInt(item.quantity);
    return { ...item, offer };
  });
  const timestamp = store.clock();
  beginImmediateWithRetry(store.db);
  try {
    store.db.prepare("INSERT INTO orders (id, user_id, status, currency, subtotal_usd, created_at, updated_at) VALUES (?, ?, 'pending_payment', ?, ?, ?, ?)")
      .run(order.id, order.userId, order.currency, moneyString(order.subtotalUsd), timestamp, timestamp);
    const insert = store.db.prepare("INSERT INTO order_items (id, order_id, product_id, vendor_offer_id, title, unit_price_usd, quantity, plastic_cover, gift_wrap) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const item of snapshots) insert.run(identifier(), order.id, item.offer.product_id, item.offer.id, item.offer.title, item.offer.price_usd, item.quantity, item.plasticCover ? 1 : 0, item.giftWrap ? 1 : 0);
    store.db.exec("COMMIT");
  } catch (error) {
    store.db.exec("ROLLBACK");
    throw error;
  }
  store.log("checkout_order_created", { result: "accepted", order_id: order.id, item_count: snapshots.length });
  return { id: order.id, currency: order.currency, subtotalUsd: moneyString(order.subtotalUsd), status: "pending_payment" };
}

export async function createStripeCheckoutSession(store, orderId, environment = process.env, fetcher = fetch) {
  const secret = environment.STRIPE_SECRET_KEY;
  const successUrl = environment.STRIPE_SUCCESS_URL;
  const cancelUrl = environment.STRIPE_CANCEL_URL;
  if (!secret || !successUrl || !cancelUrl) throw new Error("Stripe checkout is not configured.");
  const order = store.db.prepare("SELECT id, user_id, subtotal_usd, currency FROM orders WHERE id = ?").get(orderId);
  if (!order) throw new Error("Order does not exist.");
  const items = store.db.prepare("SELECT title, unit_price_usd, quantity FROM order_items WHERE order_id = ?").all(orderId);
  const body = new URLSearchParams({ mode: "payment", success_url: successUrl, cancel_url: cancelUrl, "metadata[order_id]": order.id });
  items.forEach((item, index) => {
    body.set(`line_items[${index}][price_data][currency]`, order.currency.toLowerCase());
    body.set(`line_items[${index}][price_data][product_data][name]`, item.title);
    body.set(`line_items[${index}][price_data][unit_amount_decimal]`, item.unit_price_usd);
    body.set(`line_items[${index}][quantity]`, String(item.quantity));
  });
  const response = await fetcher("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(STRIPE_FETCH_TIMEOUT_MS),
  });
  const session = await response.json();
  if (!response.ok || !session.id || !session.url) throw new Error("Stripe checkout session could not be created.");
  store.db.prepare("UPDATE orders SET stripe_session_id = ?, checkout_url = ?, updated_at = ? WHERE id = ?").run(session.id, session.url, store.clock(), order.id);
  store.log("checkout_session_created", { result: "accepted", order_id: order.id, provider: "stripe" });
  return { id: session.id, url: session.url };
}

export function verifyStripeSignature(payload, signature, secret) {
  if (typeof signature !== "string" || typeof secret !== "string" || secret.length < 16) return false;
  const fields = Object.fromEntries(signature.split(",").map((part) => part.split("=", 2)));
  if (!fields.t || !fields.v1) return false;
  const expected = createHmac("sha256", secret).update(`${fields.t}.${payload}`).digest("hex");
  const received = Buffer.from(fields.v1, "hex");
  const actual = Buffer.from(expected, "hex");
  return received.length === actual.length && timingSafeEqual(received, actual);
}

export function processStripeWebhook(store, payload, signature, webhookSecret) {
  if (!verifyStripeSignature(payload, signature, webhookSecret)) throw new Error("Stripe webhook signature is invalid.");
  const event = JSON.parse(payload);
  if (event.type !== "checkout.session.completed") return { handled: false };
  const session = event.data?.object;
  const orderId = session?.metadata?.order_id;
  if (!orderId || !session.id) throw new Error("Stripe event has no order reference.");
  ensureOrderCommsOutboxSchema(store);
  // The paid transition and the confirmation-comms enqueue commit together, so a crash or a
  // failed dispatch can never leave an order paid with no durable record that it owes an email.
  beginImmediateWithRetry(store.db);
  let updated = false;
  let paid = false;
  let enqueued = false;
  try {
    updated = store.db.prepare("UPDATE orders SET status = 'paid', stripe_session_id = ?, updated_at = ? WHERE id = ? AND status = 'pending_payment'").run(session.id, store.clock(), orderId).changes === 1;
    paid = store.db.prepare("SELECT status FROM orders WHERE id = ?").get(orderId)?.status === "paid";
    if (paid) enqueued = enqueueOrderComms(store, orderId, { kind: "order.paid" }).enqueued;
    store.db.exec("COMMIT");
  } catch (error) {
    store.db.exec("ROLLBACK");
    throw error;
  }
  store.log("checkout_payment_completed", { result: updated ? "accepted" : "ignored", order_id: orderId, provider: "stripe", paid, comms_enqueued: enqueued });
  return { handled: true, updated, paid, enqueued, orderId };
}

export function listCustomerOrders(store, user) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  return store.db.prepare("SELECT id, status, currency, subtotal_usd AS subtotalUsd, created_at AS createdAt FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC").all(user.id);
}
