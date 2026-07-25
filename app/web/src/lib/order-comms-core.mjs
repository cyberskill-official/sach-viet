import { createHash, randomBytes } from "node:crypto";
import {
  ensureExternalDeliverySchema,
  resolveEmailTransport,
} from "./email-zalo-integrations-core.mjs";
import { createNotification } from "./notification-core.mjs";

function identifier() {
  return randomBytes(16).toString("hex");
}

function redactRecipient(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 16);
}

function lookupUserEmail(store, userId) {
  try {
    const row = store.db.prepare("SELECT email FROM users WHERE id = ?").get(userId);
    return typeof row?.email === "string" ? row.email : null;
  } catch {
    return null;
  }
}

function ensureNotificationTables(store) {
  store.db.exec(`
    CREATE TABLE IF NOT EXISTS notification_event_types (
      key TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      created_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      deeplink_path TEXT NOT NULL,
      is_read INTEGER NOT NULL CHECK (is_read IN (0, 1)),
      created_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at DESC, id DESC);
    CREATE TABLE IF NOT EXISTS user_channels (
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      is_enabled INTEGER NOT NULL CHECK (is_enabled IN (0, 1)),
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, channel)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS user_notification_preferences (
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      in_app_enabled INTEGER NOT NULL CHECK (in_app_enabled IN (0, 1)),
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, event_type)
    ) STRICT;
  `);
  const now = store.clock();
  store.db
    .prepare("INSERT OR IGNORE INTO notification_event_types (key, description, created_at) VALUES (?, ?, ?)")
    .run("order.paid", "order paid", now);
}

function loadPaidOrder(store, orderId) {
  return store.db
    .prepare(
      `SELECT id, user_id AS userId, status, currency, subtotal_usd AS subtotalUsd
       FROM orders WHERE id = ?`,
    )
    .get(orderId);
}

function recordEmailAttempt(store, { notificationId, outcome, reason = null, recipientHash = null }) {
  ensureExternalDeliverySchema(store);
  store.db
    .prepare(
      `INSERT INTO notification_delivery_attempts
        (id, notification_id, channel, outcome, reason, recipient_hash, created_at)
       VALUES (?, ?, 'email', ?, ?, ?, ?)`,
    )
    .run(identifier(), notificationId, outcome, reason, recipientHash, store.clock());
}

/**
 * After a successful paid transition: in-app `order.paid` notification plus transactional email.
 * Email always attempts (ignores user email-channel preference). SMTP when configured; else recording stub.
 */
export function dispatchOrderPaidConfirmation(
  store,
  orderId,
  {
    env = process.env,
    emailTransport = resolveEmailTransport(env, { log: store.log }),
    resolveEmail = lookupUserEmail,
  } = {},
) {
  const order = loadPaidOrder(store, orderId);
  if (!order) {
    store.log?.("order_confirmation_skipped", { result: "skipped", reason: "order_missing", order_id: orderId });
    return { emailed: false, notified: false, reason: "order_missing" };
  }
  if (order.status !== "paid") {
    store.log?.("order_confirmation_skipped", { result: "skipped", reason: "not_paid", order_id: orderId });
    return { emailed: false, notified: false, reason: "not_paid" };
  }

  const title = "Xác nhận đơn hàng / Order confirmed";
  const body = `Đơn hàng ${order.id} đã thanh toán thành công. Tổng: ${order.subtotalUsd} ${order.currency}.`;
  const deeplinkPath = `/ecom/orders/${order.id}`;

  ensureNotificationTables(store);
  let notified = false;
  let notificationId = order.id;
  try {
    const notification = createNotification(store, { id: order.userId, role: "customer" }, {
      userId: order.userId,
      eventType: "order.paid",
      title,
      body,
      deeplinkPath,
    });
    notified = Boolean(notification);
    if (notification?.id) notificationId = notification.id;
  } catch (error) {
    store.log?.("order_confirmation_notify_failed", {
      result: "failed",
      order_id: order.id,
      reason: error instanceof Error ? error.message : "notify_failed",
    });
  }

  const recipient = resolveEmail(store, order.userId);
  if (!recipient) {
    recordEmailAttempt(store, {
      notificationId,
      outcome: "skipped",
      reason: "missing_recipient",
    });
    store.log?.("order_confirmation_email_skipped", {
      result: "skipped",
      reason: "missing_recipient",
      order_id: order.id,
    });
    return { emailed: false, notified, reason: "missing_recipient", transportMode: emailTransport.mode };
  }

  const result = emailTransport.send({
    notificationId,
    title,
    body,
    deeplinkPath,
    eventType: "order.paid",
    recipient,
  });
  const outcome = result?.outcome || "failed";
  recordEmailAttempt(store, {
    notificationId,
    outcome,
    reason: result?.reason || null,
    recipientHash: redactRecipient(recipient),
  });
  store.log?.("order_confirmation_email_dispatched", {
    result: outcome,
    order_id: order.id,
    transport_mode: emailTransport.mode,
    recipient_hash: redactRecipient(recipient),
  });

  return {
    emailed: outcome === "sent" || outcome === "recorded",
    notified,
    outcome,
    transportMode: emailTransport.mode,
    recipientHash: redactRecipient(recipient),
  };
}
