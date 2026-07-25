import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

function identifier() { return randomBytes(16).toString("hex"); }
function now() { return Date.now(); }
function required(value, label) { if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`); return value.trim(); }
function moneyUnits(value) { const [whole, fraction = ""] = value.split("."); return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0")); }
function moneyString(value) { return `${value / 10000n}.${String(value % 10000n).padStart(4, "0")}`; }

export function createCommerceStore({ dbPath, clock = now, log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-005", ...fields })) } = {}) {
  const databasePath = dbPath || process.env.DATABASE_PATH || "/data/sachviet.sqlite";
  if (!existsSync(dirname(databasePath))) mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending_payment', 'paid', 'payment_failed')),
      currency TEXT NOT NULL CHECK (currency = 'USD'),
      subtotal_usd TEXT NOT NULL,
      checkout_url TEXT,
      stripe_session_id TEXT UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      vendor_offer_id TEXT NOT NULL,
      title TEXT NOT NULL,
      unit_price_usd TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      plastic_cover INTEGER NOT NULL CHECK (plastic_cover IN (0, 1)),
      gift_wrap INTEGER NOT NULL CHECK (gift_wrap IN (0, 1)),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    ) STRICT;
  `);
  return { db, clock, log, close: () => db.close() };
}

export function ensureCommerceLegacyColumns(store) {
  const orderColumns = store.db.prepare("PRAGMA table_info(orders)").all().map((row) => row.name);
  if (!orderColumns.includes("legacy_wp_order_id")) {
    store.db.exec("ALTER TABLE orders ADD COLUMN legacy_wp_order_id TEXT");
  }
  const itemColumns = store.db.prepare("PRAGMA table_info(order_items)").all().map((row) => row.name);
  if (!itemColumns.includes("legacy_wp_order_item_id")) {
    store.db.exec("ALTER TABLE order_items ADD COLUMN legacy_wp_order_item_id TEXT");
  }
  store.db.exec("CREATE UNIQUE INDEX IF NOT EXISTS orders_legacy_wp_order_id_uq ON orders(legacy_wp_order_id) WHERE legacy_wp_order_id IS NOT NULL");
  store.db.exec("CREATE UNIQUE INDEX IF NOT EXISTS order_items_legacy_wp_order_item_id_uq ON order_items(legacy_wp_order_item_id) WHERE legacy_wp_order_item_id IS NOT NULL");
}

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
  store.db.prepare("INSERT INTO orders (id, user_id, status, currency, subtotal_usd, created_at, updated_at) VALUES (?, ?, 'pending_payment', ?, ?, ?, ?)")
    .run(order.id, order.userId, order.currency, moneyString(order.subtotalUsd), timestamp, timestamp);
  const insert = store.db.prepare("INSERT INTO order_items (id, order_id, product_id, vendor_offer_id, title, unit_price_usd, quantity, plastic_cover, gift_wrap) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  for (const item of snapshots) insert.run(identifier(), order.id, item.offer.product_id, item.offer.id, item.offer.title, item.offer.price_usd, item.quantity, item.plasticCover ? 1 : 0, item.giftWrap ? 1 : 0);
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
  const response = await fetcher("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
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
  const update = store.db.prepare("UPDATE orders SET status = 'paid', stripe_session_id = ?, updated_at = ? WHERE id = ? AND status = 'pending_payment'").run(session.id, store.clock(), orderId);
  store.log("checkout_payment_completed", { result: update.changes ? "accepted" : "ignored", order_id: orderId, provider: "stripe" });
  return { handled: true, updated: update.changes === 1, orderId };
}

export function listCustomerOrders(store, user) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  return store.db.prepare("SELECT id, status, currency, subtotal_usd AS subtotalUsd, created_at AS createdAt FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC").all(user.id);
}
