import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { enqueueOrderComms, ensureOrderCommsOutboxSchema } from "./order-comms-outbox-core.mjs";
import { beginImmediateWithRetry, openDatabase } from "./db.mjs";

/** Stripe Checkout Session create must fail closed rather than hang the checkout request. */
export const STRIPE_FETCH_TIMEOUT_MS = 15_000;
/** PayPal OAuth / Orders / webhook verify must fail closed rather than hang. */
export const PAYPAL_FETCH_TIMEOUT_MS = 15_000;
/** Reject oversized webhook bodies before JSON parse / signature work. */
export const STRIPE_WEBHOOK_MAX_BODY_BYTES = 64 * 1024;
export const PAYPAL_WEBHOOK_MAX_BODY_BYTES = 64 * 1024;
/** Abandoned pending_payment rows release reserved stock after this TTL. */
export const PENDING_ORDER_TTL_MS = 30 * 60 * 1000;
/** Interim DEC-COM-001: tax and shipping are not charged (4-dp money string). */
export const ZERO_MONEY_USD = "0.0000";
export const INVENTORY_REASON_RESERVE = "reserve";
export const INVENTORY_REASON_EXPIRE_RESTOCK = "expire_restock";

/**
 * Interim retail commerce policy from DEC-COM-001 / DEC-RET-001 / DEC-PV3-001.
 * Do not invent tax jurisdictions, carrier rates, or return windows here.
 */
export function interimCommercePolicy() {
  return {
    version: "interim-defaults-2026-08-20",
    currency: "USD",
    taxCharged: false,
    shippingCharged: false,
    taxUsd: ZERO_MONEY_USD,
    shippingUsd: ZERO_MONEY_USD,
    reservationTtlMs: PENDING_ORDER_TTL_MS,
    paymentsMode: "sandbox",
    returnsPolicy: "deferred",
    shippingPreference: "NO_SHIPPING",
  };
}

const PAYPAL_SANDBOX_API = "https://api-m.sandbox.paypal.com";
const PAYPAL_LIVE_API = "https://api-m.paypal.com";

/** Checkout providers accepted by POST /api/checkout (default stripe). */
export const CHECKOUT_PROVIDERS = Object.freeze(["stripe", "paypal"]);

/**
 * Local `next start` smokes only. Never on Vercel.
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 */
export function sandboxCheckoutStubEnabled(env = process.env) {
  if (env.VERCEL === "1" || env.VERCEL_ENV === "production") return false;
  return env.CHECKOUT_SANDBOX_STUB === "1" || env.TEST_HOOKS_ENABLED === "1";
}

/**
 * Refuse live payment credentials on every checkout path, including the sandbox stub.
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} environment
 */
export function assertSandboxPaymentsOnly(environment = process.env) {
  const stripe = typeof environment.STRIPE_SECRET_KEY === "string" ? environment.STRIPE_SECRET_KEY : "";
  if (stripe.startsWith("sk_live_")) {
    throw new Error("Live Stripe keys are refused; use sk_test_… or unset Stripe.");
  }
  const mode = (environment.PAYPAL_MODE || "").trim().toLowerCase();
  if (mode === "live") throw new Error("PayPal live mode is refused; use PAYPAL_MODE=sandbox.");
}

/**
 * Normalize checkout provider from request body. Default stripe for backward compatibility.
 * @param {unknown} value
 * @param {{ allowStub?: boolean }} [options]
 * @returns {"stripe" | "paypal" | "stub"}
 */
export function normalizeCheckoutProvider(value, { allowStub = false } = {}) {
  if (value === undefined || value === null || value === "") return "stripe";
  if (typeof value !== "string") {
    throw new Error(allowStub ? "Checkout provider must be stripe, paypal, or stub." : "Checkout provider must be stripe or paypal.");
  }
  const normalized = value.trim().toLowerCase();
  if (allowStub && normalized === "stub") return "stub";
  if (!CHECKOUT_PROVIDERS.includes(normalized)) {
    throw new Error(allowStub ? "Checkout provider must be stripe, paypal, or stub." : "Checkout provider must be stripe or paypal.");
  }
  return /** @type {"stripe" | "paypal"} */ (normalized);
}

/**
 * Refuse live Stripe secret keys (sandbox unlock only).
 * @param {string} secret
 */
export function assertStripeTestSecret(secret) {
  if (typeof secret !== "string" || !secret.startsWith("sk_test_")) {
    throw new Error("Stripe checkout requires a test-mode secret key (sk_test_…).");
  }
}

/**
 * Refuse PAYPAL_MODE=live (sandbox unlock only).
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} environment
 * @returns {"sandbox"}
 */
export function assertPayPalSandboxMode(environment = process.env) {
  const mode = (environment.PAYPAL_MODE || "sandbox").trim().toLowerCase();
  if (mode === "live") throw new Error("PayPal live mode is refused; use PAYPAL_MODE=sandbox.");
  if (mode !== "sandbox") throw new Error("PayPal checkout requires PAYPAL_MODE=sandbox.");
  return "sandbox";
}

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} environment
 */
export function paypalApiBase(environment = process.env) {
  assertPayPalSandboxMode(environment);
  return PAYPAL_SANDBOX_API;
}

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

export async function createCommerceStore({
  dbPath,
  clock = now,
  log = defaultCommerceLog,
  pendingOrderTtlMs = PENDING_ORDER_TTL_MS,
} = {}) {
  const db = await openDatabase(dbPath);
  const ttl = Number.isFinite(pendingOrderTtlMs) && pendingOrderTtlMs > 0 ? pendingOrderTtlMs : PENDING_ORDER_TTL_MS;
  return { db, clock, log, pendingOrderTtlMs: ttl, close: () => db.close() };
}

/** No-op: legacy columns and indexes are now applied by the initial migration. */
export function ensureCommerceLegacyColumns() {}

export function normalizeCartItem(item) {
  const quantity = Number(item?.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Cart quantity must be between 1 and 99.");
  return { vendorOfferId: required(item?.vendorOfferId, "Vendor offer ID"), quantity, plasticCover: item.plasticCover === true, giftWrap: item.giftWrap === true };
}

/**
 * Server-side B2C quote against live offers. Does not reserve stock (checkout does).
 * Tax and shipping are always zero under interim DEC-COM-001.
 * @param {{ db: unknown }} store
 * @param {unknown[]} items
 */
export async function quoteRetailCart(store, items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cart cannot be empty.");
  const normalizedItems = items.map(normalizeCartItem);
  const lines = [];
  let subtotalUsd = 0n;
  for (const item of normalizedItems) {
    const offer = await store.db
      .prepare(
        `SELECT vendor_offers.id, vendor_offers.product_id, vendor_offers.price_usd, vendor_offers.stock_quantity, products.title
         FROM vendor_offers JOIN products ON products.id = vendor_offers.product_id
         WHERE vendor_offers.id = ? AND vendor_offers.is_active = 1`,
      )
      .get(item.vendorOfferId);
    if (!offer) throw new Error("One cart offer is no longer available.");
    const stockAvailable = Number(offer.stock_quantity);
    if (!Number.isFinite(stockAvailable) || stockAvailable < item.quantity) {
      throw new Error("One cart offer is no longer available.");
    }
    const lineSubtotal = moneyUnits(offer.price_usd) * BigInt(item.quantity);
    subtotalUsd += lineSubtotal;
    lines.push({
      vendorOfferId: offer.id,
      productId: offer.product_id,
      title: offer.title,
      unitPriceUsd: offer.price_usd,
      quantity: item.quantity,
      lineSubtotalUsd: moneyString(lineSubtotal),
      stockAvailable,
      plasticCover: item.plasticCover,
      giftWrap: item.giftWrap,
    });
  }
  const policy = interimCommercePolicy();
  const subtotal = moneyString(subtotalUsd);
  return {
    currency: policy.currency,
    lines,
    subtotalUsd: subtotal,
    taxUsd: policy.taxUsd,
    shippingUsd: policy.shippingUsd,
    totalUsd: subtotal,
    reservationTtlMs: policy.reservationTtlMs,
    policy,
  };
}

function retailTotalsFromSubtotal(subtotalUsd) {
  const policy = interimCommercePolicy();
  const subtotal = typeof subtotalUsd === "string" ? subtotalUsd : moneyString(subtotalUsd);
  return {
    currency: policy.currency,
    subtotalUsd: subtotal,
    taxUsd: policy.taxUsd,
    shippingUsd: policy.shippingUsd,
    totalUsd: subtotal,
    reservationTtlMs: policy.reservationTtlMs,
    returnsPolicy: policy.returnsPolicy,
    policy,
  };
}

export async function createPendingOrder(store, user, items) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cart cannot be empty.");
  const normalizedItems = items.map(normalizeCartItem);
  const order = { id: identifier(), userId: user.id, currency: "USD", subtotalUsd: 0n };
  const timestamp = store.clock();
  const expiresAt = timestamp + (store.pendingOrderTtlMs || PENDING_ORDER_TTL_MS);
  await beginImmediateWithRetry(store.db);
  try {
    const snapshots = [];
    for (const item of normalizedItems) {
      const offer = await store.db
        .prepare(
          `SELECT vendor_offers.id, vendor_offers.product_id, vendor_offers.price_usd, vendor_offers.stock_quantity, products.title
           FROM vendor_offers JOIN products ON products.id = vendor_offers.product_id
           WHERE vendor_offers.id = ? AND vendor_offers.is_active = 1`,
        )
        .get(item.vendorOfferId);
      if (!offer) throw new Error("One cart offer is no longer available.");
      if (Number(offer.stock_quantity) < item.quantity) throw new Error("One cart offer is no longer available.");
      const reserved = await store.db
        .prepare(
          "UPDATE vendor_offers SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ? AND is_active = 1 AND stock_quantity >= ?",
        )
        .run(item.quantity, timestamp, offer.id, item.quantity);
      if (reserved.changes !== 1) throw new Error("One cart offer is no longer available.");
      order.subtotalUsd += moneyUnits(offer.price_usd) * BigInt(item.quantity);
      snapshots.push({ ...item, offer });
    }
    await store.db
      .prepare(
        "INSERT INTO orders (id, user_id, status, currency, subtotal_usd, created_at, updated_at, expires_at) VALUES (?, ?, 'pending_payment', ?, ?, ?, ?, ?)",
      )
      .run(order.id, order.userId, order.currency, moneyString(order.subtotalUsd), timestamp, timestamp, expiresAt);
    const insert = store.db.prepare(
      "INSERT INTO order_items (id, order_id, product_id, vendor_offer_id, title, unit_price_usd, quantity, plastic_cover, gift_wrap) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const movement = store.db.prepare(
      "INSERT INTO inventory_movements (id, order_id, offer_id, delta, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const item of snapshots) {
      await insert.run(
        identifier(),
        order.id,
        item.offer.product_id,
        item.offer.id,
        item.offer.title,
        item.offer.price_usd,
        item.quantity,
        item.plasticCover ? 1 : 0,
        item.giftWrap ? 1 : 0,
      );
      await movement.run(
        identifier(),
        order.id,
        item.offer.id,
        -item.quantity,
        INVENTORY_REASON_RESERVE,
        timestamp,
      );
    }
    await store.db.exec("COMMIT");
  } catch (error) {
    try {
      await store.db.exec("ROLLBACK");
    } catch {
      // ignore
    }
    throw error;
  }
  store.log("checkout_order_created", { result: "accepted", order_id: order.id, item_count: normalizedItems.length });
  const subtotal = moneyString(order.subtotalUsd);
  return {
    id: order.id,
    status: "pending_payment",
    expiresAt,
    ...retailTotalsFromSubtotal(subtotal),
  };
}

/**
 * Flip one expired pending_payment order to payment_failed and restock in the same
 * transaction. No-op if another worker (or a paid webhook) already moved the row.
 */
export async function expireAndRestockOrder(store, orderId) {
  const timestamp = store.clock();
  await beginImmediateWithRetry(store.db);
  try {
    const flipped = await store.db
      .prepare(
        "UPDATE orders SET status = 'payment_failed', updated_at = ? WHERE id = ? AND status = 'pending_payment'",
      )
      .run(timestamp, orderId);
    if (flipped.changes !== 1) {
      await store.db.exec("ROLLBACK");
      return { expired: false, restocked: 0 };
    }
    const items = await store.db
      .prepare("SELECT vendor_offer_id AS offerId, quantity FROM order_items WHERE order_id = ?")
      .all(orderId);
    const movement = store.db.prepare(
      "INSERT INTO inventory_movements (id, order_id, offer_id, delta, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const item of items) {
      await store.db
        .prepare("UPDATE vendor_offers SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?")
        .run(item.quantity, timestamp, item.offerId);
      await movement.run(
        identifier(),
        orderId,
        item.offerId,
        item.quantity,
        INVENTORY_REASON_EXPIRE_RESTOCK,
        timestamp,
      );
    }
    await store.db.exec("COMMIT");
    store.log("pending_order_expired", {
      result: "accepted",
      order_id: orderId,
      restocked_lines: items.length,
    });
    return { expired: true, restocked: items.length };
  } catch (error) {
    try {
      await store.db.exec("ROLLBACK");
    } catch {
      // ignore
    }
    throw error;
  }
}

/**
 * Expire due pending_payment rows and restore reserved stock. Safe to run on the
 * same cron as the outbox drain.
 */
export async function expirePendingOrders(store, { limit = 50 } = {}) {
  const now = store.clock();
  const due = await store.db
    .prepare(
      `SELECT id FROM orders
       WHERE status = 'pending_payment' AND expires_at IS NOT NULL AND expires_at <= ?
       ORDER BY expires_at ASC, id ASC
       LIMIT ?`,
    )
    .all(now, Math.max(1, Number(limit) || 1));
  const summary = { scanned: due.length, expired: 0, skipped: 0 };
  for (const row of due) {
    const result = await expireAndRestockOrder(store, row.id);
    if (result.expired) summary.expired += 1;
    else summary.skipped += 1;
  }
  return summary;
}

export async function createStripeCheckoutSession(store, orderId, environment = process.env, fetcher = fetch) {
  const secret = environment.STRIPE_SECRET_KEY;
  const successUrl = environment.STRIPE_SUCCESS_URL;
  const cancelUrl = environment.STRIPE_CANCEL_URL;
  if (!secret || !successUrl || !cancelUrl) throw new Error("Stripe checkout is not configured.");
  assertStripeTestSecret(secret);
  const order = await store.db.prepare("SELECT id, user_id, subtotal_usd, currency FROM orders WHERE id = ?").get(orderId);
  if (!order) throw new Error("Order does not exist.");
  const items = await store.db.prepare("SELECT title, unit_price_usd, quantity FROM order_items WHERE order_id = ?").all(orderId);
  const body = new URLSearchParams({ mode: "payment", success_url: successUrl, cancel_url: cancelUrl, "metadata[order_id]": order.id });
  items.forEach((item, index) => {
    // Stripe USD payment mode allows at most 2 decimal places; our money strings are 4-dp.
    const unitAmountCents = Number(moneyUnits(item.unit_price_usd) / 100n);
    body.set(`line_items[${index}][price_data][currency]`, order.currency.toLowerCase());
    body.set(`line_items[${index}][price_data][product_data][name]`, item.title);
    body.set(`line_items[${index}][price_data][unit_amount]`, String(unitAmountCents));
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
  await store.db.prepare(
    "UPDATE orders SET payment_provider = 'stripe', stripe_session_id = ?, checkout_url = ?, updated_at = ? WHERE id = ?",
  ).run(session.id, session.url, store.clock(), order.id);
  store.log("checkout_session_created", { result: "accepted", order_id: order.id, provider: "stripe" });
  return { id: session.id, url: session.url, provider: "stripe" };
}

/**
 * Local-only checkout that creates a pending order without Stripe/PayPal.
 * Disabled on Vercel. Refuses sk_live_ and PAYPAL_MODE=live.
 */
export async function createSandboxStubCheckout(store, orderId, environment = process.env) {
  if (!sandboxCheckoutStubEnabled(environment)) {
    throw new Error("Sandbox checkout stub is not enabled.");
  }
  assertSandboxPaymentsOnly(environment);
  const order = await store.db.prepare("SELECT id FROM orders WHERE id = ?").get(orderId);
  if (!order) throw new Error("Order does not exist.");
  const checkoutUrl = `/ecom/orders/${order.id}`;
  await store.db
    .prepare("UPDATE orders SET payment_provider = 'stub', checkout_url = ?, updated_at = ? WHERE id = ?")
    .run(checkoutUrl, store.clock(), order.id);
  store.log("checkout_session_created", { result: "accepted", order_id: order.id, provider: "stub" });
  return { id: `stub_${order.id}`, url: checkoutUrl, provider: "stub" };
}

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} environment
 * @param {typeof fetch} [fetcher]
 */
export async function createPayPalAccessToken(environment = process.env, fetcher = fetch) {
  assertPayPalSandboxMode(environment);
  const clientId = environment.PAYPAL_CLIENT_ID;
  const clientSecret = environment.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PayPal checkout is not configured.");
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetcher(`${paypalApiBase(environment)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(PAYPAL_FETCH_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new Error("PayPal access token could not be created.");
  return payload.access_token;
}

/**
 * Create a PayPal Orders v2 checkout and persist approve URL + paypal_order_id.
 * @param {*} store
 * @param {string} orderId
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [environment]
 * @param {typeof fetch} [fetcher]
 */
export async function createPayPalCheckoutOrder(store, orderId, environment = process.env, fetcher = fetch) {
  assertPayPalSandboxMode(environment);
  const returnUrl = environment.PAYPAL_RETURN_URL;
  const cancelUrl = environment.PAYPAL_CANCEL_URL;
  const clientId = environment.PAYPAL_CLIENT_ID;
  const clientSecret = environment.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret || !returnUrl || !cancelUrl) {
    throw new Error("PayPal checkout is not configured.");
  }
  const order = await store.db.prepare("SELECT id, user_id, subtotal_usd, currency FROM orders WHERE id = ?").get(orderId);
  if (!order) throw new Error("Order does not exist.");
  const accessToken = await createPayPalAccessToken(environment, fetcher);
  const amount = String(order.subtotal_usd).replace(/0+$/, "").replace(/\.$/, "") || order.subtotal_usd;
  // PayPal expects two decimal places for USD.
  const value = Number(order.subtotal_usd).toFixed(2);
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: order.id,
        custom_id: order.id,
        amount: { currency_code: order.currency, value },
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
    },
  };
  const response = await fetcher(`${paypalApiBase(environment)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(PAYPAL_FETCH_TIMEOUT_MS),
  });
  const paypalOrder = await response.json().catch(() => ({}));
  if (!response.ok || !paypalOrder.id) throw new Error("PayPal checkout order could not be created.");
  const approve = Array.isArray(paypalOrder.links)
    ? paypalOrder.links.find((link) => link.rel === "approve" && typeof link.href === "string")
    : null;
  if (!approve?.href) throw new Error("PayPal checkout order is missing an approve link.");
  await store.db.prepare(
    "UPDATE orders SET payment_provider = 'paypal', paypal_order_id = ?, checkout_url = ?, updated_at = ? WHERE id = ?",
  ).run(paypalOrder.id, approve.href, store.clock(), order.id);
  store.log("checkout_session_created", {
    result: "accepted",
    order_id: order.id,
    provider: "paypal",
    amount_preview: amount,
  });
  return { id: paypalOrder.id, url: approve.href, provider: "paypal" };
}

/**
 * Mark order paid + enqueue order.paid outbox (same transaction pattern as Stripe).
 * @param {*} store
 * @param {string} orderId
 * @param {{ paypalOrderId?: string | null }} [refs]
 */
async function markOrderPaidWithOutbox(store, orderId, refs = {}) {
  ensureOrderCommsOutboxSchema(store);
  await beginImmediateWithRetry(store.db);
  let updated = false;
  let paid = false;
  let enqueued = false;
  try {
    if (refs.paypalOrderId) {
      updated =
        (await store.db
          .prepare(
            "UPDATE orders SET status = 'paid', paypal_order_id = ?, updated_at = ? WHERE id = ? AND status = 'pending_payment'",
          )
          .run(refs.paypalOrderId, store.clock(), orderId)).changes === 1;
    } else {
      updated =
        (await store.db
          .prepare("UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ? AND status = 'pending_payment'")
          .run(store.clock(), orderId)).changes === 1;
    }
    const status = (await store.db.prepare("SELECT status FROM orders WHERE id = ?").get(orderId))?.status;
    paid = status === "paid";
    const rejected = status === "payment_failed";
    if (paid) enqueued = (await enqueueOrderComms(store, orderId, { kind: "order.paid" })).enqueued;
    await store.db.exec("COMMIT");
    return rejected
      ? { updated, paid, enqueued, rejected: true, reason: "order_expired", orderId }
      : { updated, paid, enqueued, orderId };
  } catch (error) {
    await store.db.exec("ROLLBACK");
    throw error;
  }
}

/**
 * Capture an approved PayPal order and transition the local order to paid.
 * @param {*} store
 * @param {string} paypalOrderId
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [environment]
 * @param {typeof fetch} [fetcher]
 */
export async function capturePayPalOrder(store, paypalOrderId, environment = process.env, fetcher = fetch) {
  assertPayPalSandboxMode(environment);
  const token = required(paypalOrderId, "PayPal order ID");
  const local = await store.db
    .prepare("SELECT id, status, paypal_order_id FROM orders WHERE paypal_order_id = ?")
    .get(token);
  if (!local) throw new Error("PayPal order is not linked to a local order.");
  if (local.status === "paid") {
    return { handled: true, updated: false, paid: true, enqueued: false, rejected: false, orderId: local.id };
  }
  if (local.status === "payment_failed") {
    return {
      handled: true,
      updated: false,
      paid: false,
      enqueued: false,
      rejected: true,
      reason: "order_expired",
      orderId: local.id,
    };
  }
  const accessToken = await createPayPalAccessToken(environment, fetcher);
  const response = await fetcher(`${paypalApiBase(environment)}/v2/checkout/orders/${encodeURIComponent(token)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
    signal: AbortSignal.timeout(PAYPAL_FETCH_TIMEOUT_MS),
  });
  const capture = await response.json().catch(() => ({}));
  // Idempotent: already-captured returns 422 ORDER_ALREADY_CAPTURED — still mark paid if pending.
  const alreadyCaptured =
    !response.ok &&
    Array.isArray(capture.details) &&
    capture.details.some((detail) => detail?.issue === "ORDER_ALREADY_CAPTURED");
  if (!response.ok && !alreadyCaptured && capture.status !== "COMPLETED") {
    throw new Error("PayPal order could not be captured.");
  }
  if (!alreadyCaptured && capture.status && capture.status !== "COMPLETED") {
    throw new Error("PayPal order capture did not complete.");
  }
  const result = await markOrderPaidWithOutbox(store, local.id, { paypalOrderId: token });
  store.log("checkout_payment_completed", {
    result: result.updated ? "accepted" : "ignored",
    order_id: local.id,
    provider: "paypal",
    paid: result.paid,
    comms_enqueued: result.enqueued,
  });
  return { handled: true, ...result };
}

/**
 * Verify PayPal webhook via /v1/notifications/verify-webhook-signature.
 * @param {string} payload
 * @param {Headers | Record<string, string | null | undefined>} headers
 * @param {string} webhookId
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [environment]
 * @param {typeof fetch} [fetcher]
 */
export async function verifyPayPalWebhookSignature(
  payload,
  headers,
  webhookId,
  environment = process.env,
  fetcher = fetch,
) {
  assertPayPalSandboxMode(environment);
  if (typeof webhookId !== "string" || webhookId.trim().length < 8) return false;
  const get = (name) => {
    if (typeof headers?.get === "function") return headers.get(name) || headers.get(name.toLowerCase());
    const lower = name.toLowerCase();
    for (const [key, value] of Object.entries(headers || {})) {
      if (key.toLowerCase() === lower) return value;
    }
    return null;
  };
  const transmissionId = get("paypal-transmission-id");
  const transmissionTime = get("paypal-transmission-time");
  const certUrl = get("paypal-cert-url");
  const authAlgo = get("paypal-auth-algo");
  const transmissionSig = get("paypal-transmission-sig");
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) return false;
  let webhookEvent;
  try {
    webhookEvent = JSON.parse(payload);
  } catch {
    return false;
  }
  const accessToken = await createPayPalAccessToken(environment, fetcher);
  const response = await fetcher(`${paypalApiBase(environment)}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId.trim(),
      webhook_event: webhookEvent,
    }),
    signal: AbortSignal.timeout(PAYPAL_FETCH_TIMEOUT_MS),
  });
  const result = await response.json().catch(() => ({}));
  return response.ok && result.verification_status === "SUCCESS";
}

/**
 * Process PayPal webhook events (CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.COMPLETED).
 * Verification: PayPal verify-webhook-signature API with PAYPAL_WEBHOOK_ID.
 * @param {*} store
 * @param {string} payload
 * @param {Headers | Record<string, string | null | undefined>} headers
 * @param {string} webhookId
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [environment]
 * @param {typeof fetch} [fetcher]
 */
export async function processPayPalWebhook(
  store,
  payload,
  headers,
  webhookId,
  environment = process.env,
  fetcher = fetch,
) {
  const valid = await verifyPayPalWebhookSignature(payload, headers, webhookId, environment, fetcher);
  if (!valid) throw new Error("PayPal webhook signature is invalid.");
  const event = JSON.parse(payload);
  const eventType = event.event_type || event.eventType;
  const eventId = typeof event.id === "string" && event.id ? event.id : `${eventType}:${Date.now()}`;
  await recordPaymentEvent(store, { provider: "paypal", providerEventId: eventId, payload });
  if (eventType !== "CHECKOUT.ORDER.APPROVED" && eventType !== "PAYMENT.CAPTURE.COMPLETED") {
    return { handled: false };
  }
  const resource = event.resource || {};
  const paypalOrderId =
    resource.id && eventType === "CHECKOUT.ORDER.APPROVED"
      ? resource.id
      : resource.supplementary_data?.related_ids?.order_id ||
        resource.custom_id ||
        null;
  // CAPTURE.COMPLETED may only carry custom_id as the local order id.
  if (eventType === "PAYMENT.CAPTURE.COMPLETED" && !paypalOrderId && resource.custom_id) {
    const local = await store.db.prepare("SELECT id, paypal_order_id, status FROM orders WHERE id = ?").get(resource.custom_id);
    if (!local?.paypal_order_id) throw new Error("PayPal capture event has no order reference.");
    if (local.status === "paid") {
      return { handled: true, updated: false, paid: true, enqueued: false, rejected: false, orderId: local.id };
    }
    if (local.status === "payment_failed") {
      return {
        handled: true,
        updated: false,
        paid: false,
        enqueued: false,
        rejected: true,
        reason: "order_expired",
        orderId: local.id,
      };
    }
    return await capturePayPalOrder(store, local.paypal_order_id, environment, fetcher);
  }
  if (!paypalOrderId) throw new Error("PayPal event has no order reference.");
  return await capturePayPalOrder(store, paypalOrderId, environment, fetcher);
}

/** Exported for docs/tests — live API host must never be selected under sandbox unlock. */
export const PAYPAL_API_HOSTS = Object.freeze({ sandbox: PAYPAL_SANDBOX_API, live: PAYPAL_LIVE_API });

export function verifyStripeSignature(payload, signature, secret, { now = Date.now(), toleranceSec = 300 } = {}) {
  if (typeof signature !== "string" || typeof secret !== "string" || secret.length < 16) return false;
  const fields = Object.fromEntries(signature.split(",").map((part) => part.split("=", 2)));
  if (!fields.t || !fields.v1) return false;
  const ts = Number(fields.t);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${fields.t}.${payload}`).digest("hex");
  const received = Buffer.from(fields.v1, "hex");
  const actual = Buffer.from(expected, "hex");
  return received.length === actual.length && timingSafeEqual(received, actual);
}

export async function recordPaymentEvent(store, { provider, providerEventId, orderId = null, payload = "" }) {
  const payloadHash = createHash("sha256").update(typeof payload === "string" ? payload : JSON.stringify(payload || "")).digest("hex");
  const inserted = await store.db
    .prepare(
      `INSERT INTO payment_events (id, provider, provider_event_id, order_id, payload_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (provider, provider_event_id) DO NOTHING`,
    )
    .run(identifier(), provider, providerEventId, orderId, payloadHash, store.clock());
  return { recorded: inserted.changes === 1, payloadHash };
}

export async function processStripeWebhook(store, payload, signature, webhookSecret) {
  if (!verifyStripeSignature(payload, signature, webhookSecret)) throw new Error("Stripe webhook signature is invalid.");
  const event = JSON.parse(payload);
  if (event.type !== "checkout.session.completed") return { handled: false };
  const session = event.data?.object;
  const orderId = session?.metadata?.order_id;
  if (!orderId || !session.id) throw new Error("Stripe event has no order reference.");
  const eventId = typeof event.id === "string" && event.id ? event.id : session.id;
  ensureOrderCommsOutboxSchema(store);
  await beginImmediateWithRetry(store.db);
  let updated = false;
  let paid = false;
  let enqueued = false;
  try {
    const order = await store.db.prepare("SELECT id, status, currency, subtotal_usd FROM orders WHERE id = ?").get(orderId);
    if (!order) throw new Error("Stripe event has no order reference.");
    if (session.amount_total != null) {
      const expectedCents = Number(moneyUnits(order.subtotal_usd) / 100n);
      if (Number(session.amount_total) !== expectedCents) throw new Error("Stripe event amount does not match the order.");
    }
    if (session.currency && String(session.currency).toLowerCase() !== String(order.currency).toLowerCase()) {
      throw new Error("Stripe event currency does not match the order.");
    }
    await recordPaymentEvent(store, { provider: "stripe", providerEventId: eventId, orderId, payload });
    if (order.status === "payment_failed") {
      await store.db.exec("COMMIT");
      store.log("checkout_payment_completed", {
        result: "rejected",
        order_id: orderId,
        provider: "stripe",
        reason: "order_expired",
      });
      return {
        handled: true,
        updated: false,
        paid: false,
        enqueued: false,
        rejected: true,
        reason: "order_expired",
        orderId,
      };
    }
    updated = (await store.db.prepare("UPDATE orders SET status = 'paid', stripe_session_id = ?, updated_at = ? WHERE id = ? AND status = 'pending_payment'").run(session.id, store.clock(), orderId)).changes === 1;
    const status = (await store.db.prepare("SELECT status FROM orders WHERE id = ?").get(orderId))?.status;
    paid = status === "paid";
    const rejected = status === "payment_failed";
    if (paid) enqueued = (await enqueueOrderComms(store, orderId, { kind: "order.paid" })).enqueued;
    await store.db.exec("COMMIT");
    store.log("checkout_payment_completed", {
      result: rejected ? "rejected" : updated ? "accepted" : "ignored",
      order_id: orderId,
      provider: "stripe",
      paid,
      comms_enqueued: enqueued,
      reason: rejected ? "order_expired" : undefined,
    });
    return rejected
      ? { handled: true, updated, paid, enqueued, rejected: true, reason: "order_expired", orderId }
      : { handled: true, updated, paid, enqueued, orderId };
  } catch (error) {
    await store.db.exec("ROLLBACK");
    throw error;
  }
}

export async function listOrderItems(store, orderId) {
  return await store.db.prepare(`
    SELECT id, product_id AS productId, vendor_offer_id AS vendorOfferId, title,
           unit_price_usd AS unitPriceUsd, quantity, plastic_cover AS plasticCover,
           gift_wrap AS giftWrap, fulfillment_status AS fulfillmentStatus
    FROM order_items WHERE order_id = ? ORDER BY id ASC
  `).all(orderId);
}

export function orderTimeline(order, items = []) {
  const events = [
    { at: order.createdAt, kind: "created", label: "Order placed", status: "pending_payment" },
  ];
  if (order.status === "paid" || order.status === "payment_failed") {
    events.push({
      at: order.updatedAt ?? order.createdAt,
      kind: "payment",
      label: order.status === "paid" ? "Payment received" : "Payment failed",
      status: order.status,
    });
  }
  for (const item of items) {
    if (!item.fulfillmentStatus) continue;
    events.push({
      at: order.updatedAt ?? order.createdAt,
      kind: "fulfillment",
      label: `${item.title}: ${item.fulfillmentStatus}`,
      status: item.fulfillmentStatus,
      orderItemId: item.id,
    });
  }
  return events;
}

function enrichCustomerOrder(order, lines) {
  const totals = retailTotalsFromSubtotal(order.subtotalUsd);
  return {
    ...order,
    ...totals,
    items: lines,
    timeline: orderTimeline(order, lines),
  };
}

export async function getCustomerOrder(store, user, orderId) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  if (typeof orderId !== "string" || !orderId.trim()) throw new Error("Order ID is required.");
  const order = await store.db.prepare(`
    SELECT id, status, currency, subtotal_usd AS subtotalUsd, created_at AS createdAt, updated_at AS updatedAt,
           expires_at AS expiresAt
    FROM orders WHERE id = ? AND user_id = ?
  `).get(orderId.trim(), user.id);
  if (!order) throw new Error("Order does not exist.");
  const items = await listOrderItems(store, order.id);
  return enrichCustomerOrder(order, items);
}

export async function listCustomerOrders(store, user, { after, limit } = {}) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  const clauses = ["user_id = ?"];
  const params = [user.id];
  if (after) {
    const cursor = await store.db
      .prepare("SELECT created_at AS createdAt, id FROM orders WHERE id = ? AND user_id = ?")
      .get(after, user.id);
    if (cursor) {
      clauses.push("(created_at, id) < (?, ?)");
      params.push(cursor.createdAt, cursor.id);
    }
  }
  const capped = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 50;
  const rows = await store.db.prepare(
    `SELECT id, status, currency, subtotal_usd AS subtotalUsd, created_at AS createdAt, updated_at AS updatedAt,
            expires_at AS expiresAt
     FROM orders WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC, id DESC LIMIT ?`,
  ).all(...params, capped + 1);
  const hasMore = rows.length > capped;
  const page = hasMore ? rows.slice(0, capped) : rows;
  const items = [];
  for (const order of page) {
    const lines = await listOrderItems(store, order.id);
    items.push(enrichCustomerOrder(order, lines));
  }
  return { items, nextCursor: hasMore ? page[page.length - 1].id : null };
}
