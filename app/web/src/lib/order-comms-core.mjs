import { createHash, randomBytes } from "node:crypto";
import {
  ensureExternalDeliverySchema,
  resolveEmailTransport,
} from "./email-zalo-integrations-core.mjs";
import { createNotification } from "./notification-core.mjs";
import {
  IDENTITY_COMMS_KINDS,
  claimDueOrderComms,
  ensureOrderCommsOutboxSchema,
  markOrderCommsAbandoned,
  markOrderCommsDelivered,
  markOrderCommsFailed,
} from "./order-comms-outbox-core.mjs";

function identifier() {
  return randomBytes(16).toString("hex");
}

function redactRecipient(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 16);
}

async function lookupUserEmail(store, userId) {
  try {
    const row = await store.db.prepare("SELECT email FROM users WHERE id = ?").get(userId);
    return typeof row?.email === "string" ? row.email : null;
  } catch {
    return null;
  }
}

async function ensureNotificationTables(store) {
  const now = store.clock();
  await store.db
    .prepare(
      "INSERT INTO notification_event_types (key, description, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
    )
    .run("order.paid", "order paid", now);
}

async function loadPaidOrder(store, orderId) {
  return await store.db
    .prepare(
      `SELECT id, user_id AS userId, status, currency, subtotal_usd AS subtotalUsd
       FROM orders WHERE id = ?`,
    )
    .get(orderId);
}

async function recordEmailAttempt(store, { notificationId, outcome, reason = null, recipientHash = null }) {
  ensureExternalDeliverySchema(store);
  await store.db
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
export async function dispatchOrderPaidConfirmation(
  store,
  orderId,
  {
    env = process.env,
    emailTransport = resolveEmailTransport(env, { log: store.log }),
    resolveEmail = lookupUserEmail,
  } = {},
) {
  const order = await loadPaidOrder(store, orderId);
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

  await ensureNotificationTables(store);
  let notified = false;
  let notificationId = order.id;
  try {
    const notification = await createNotification(store, { id: order.userId, role: "customer" }, {
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

  const recipient = await resolveEmail(store, order.userId);
  if (!recipient) {
    await recordEmailAttempt(store, {
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

  const result = await emailTransport.send({
    notificationId,
    title,
    body,
    deeplinkPath,
    eventType: "order.paid",
    recipient,
  });
  const outcome = result?.outcome || "failed";
  await recordEmailAttempt(store, {
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

  // `recorded` means a local stub accepted the payload — not a delivered email.
  // Only `sent` counts as emailed / outbox-deliverable (B-009 / F-009).
  return {
    emailed: outcome === "sent",
    notified,
    outcome,
    transportMode: emailTransport.mode,
    recipientHash: redactRecipient(recipient),
  };
}

function identityCopy(kind, token) {
  if (kind === "identity.verify") {
    return {
      title: "Xác nhận email / Verify your email",
      body: "Nhấn liên kết để xác nhận tài khoản SachViet. Use this link to verify your account.",
      deeplinkPath: `/api/auth/verify?token=${encodeURIComponent(token)}`,
    };
  }
  return {
    title: "Đặt lại mật khẩu / Reset your password",
    body: "Nhấn liên kết để đặt lại mật khẩu. Use this link to reset your password.",
    deeplinkPath: `/reset?token=${encodeURIComponent(token)}`,
  };
}

/**
 * Transactional identity email (verify / reset). Production without SMTP stays
 * `failed`/`recorded`, never `delivered`. Tests inject `submit`.
 */
export async function dispatchIdentityEmail(
  store,
  entry,
  {
    env = process.env,
    submit,
    emailTransport = resolveEmailTransport(env, { log: store.log, submit }),
  } = {},
) {
  const kind = entry?.kind;
  if (!IDENTITY_COMMS_KINDS.includes(kind)) {
    return { emailed: false, outcome: "failed", reason: "unknown_kind" };
  }
  const payload = entry.payload && typeof entry.payload === "object" ? entry.payload : {};
  const recipient = typeof payload.email === "string" ? payload.email : await lookupUserEmail(store, entry.orderId);
  const token = typeof payload.token === "string" ? payload.token : "";
  if (!recipient || !token) {
    store.log?.("identity_email_skipped", {
      result: "skipped",
      reason: "missing_recipient",
      kind,
    });
    return { emailed: false, outcome: "skipped", reason: "missing_recipient", transportMode: emailTransport.mode };
  }

  const copy = identityCopy(kind, token);
  const result = await emailTransport.send({
    notificationId: entry.id || entry.orderId,
    title: copy.title,
    body: copy.body,
    deeplinkPath: copy.deeplinkPath,
    eventType: kind,
    recipient,
  });
  const outcome = result?.outcome || "failed";
  store.log?.("identity_email_dispatched", {
    result: outcome,
    kind,
    transport_mode: emailTransport.mode,
    recipient_hash: redactRecipient(recipient),
  });
  return {
    emailed: outcome === "sent",
    outcome,
    reason: result?.reason || (outcome === "recorded" ? "recorded_not_sent" : null),
    transportMode: emailTransport.mode,
  };
}

// Reasons that will never succeed on a later attempt, so retrying only delays the dead letter.
const TERMINAL_DISPATCH_REASONS = new Set(["order_missing", "not_paid", "missing_recipient", "unknown_kind"]);

/**
 * Drains due `order_comms_outbox` entries. Runs the same way whether it is called inline by the
 * Stripe webhook or later as a retry sweep: the queue state, not the webhook result, decides what
 * still needs delivering, so an order whose first dispatch failed is picked up on replay.
 */
/**
 * @param {*} store
 * @param {{ orderId?: string | null, limit?: number, dispatch?: Function, dispatchOptions?: object }} [options]
 */
export async function processOrderCommsOutbox(
  store,
  { orderId = null, limit = 10, dispatch = dispatchOrderPaidConfirmation, dispatchOptions = {} } = {},
) {
  ensureOrderCommsOutboxSchema(store);
  const claimed = await claimDueOrderComms(store, { orderId, limit });
  const summary = { claimed: claimed.length, delivered: 0, retryScheduled: 0, abandoned: 0 };

  for (const entry of claimed) {
    let result = null;
    let failureReason = null;
    try {
      result = IDENTITY_COMMS_KINDS.includes(entry.kind)
        ? await dispatchIdentityEmail(store, entry, dispatchOptions)
        : await dispatch(store, entry.orderId, dispatchOptions);
    } catch (error) {
      failureReason = error instanceof Error ? error.message : "dispatch_threw";
    }

    if (!failureReason && result?.outcome === "sent") {
      await markOrderCommsDelivered(store, entry.id);
      summary.delivered += 1;
      store.log?.("order_comms_outbox_delivered", {
        result: "accepted",
        order_id: entry.orderId,
        kind: entry.kind,
        attempt: entry.attempt,
        outcome: result.outcome,
      });
      continue;
    }

    const reason =
      failureReason ||
      result?.reason ||
      (result?.outcome === "recorded" ? "recorded_not_sent" : null) ||
      result?.outcome ||
      "not_emailed";
    if (!failureReason && TERMINAL_DISPATCH_REASONS.has(reason)) {
      await markOrderCommsAbandoned(store, entry.id, reason);
      summary.abandoned += 1;
    } else {
      const outcome = await markOrderCommsFailed(store, entry.id, reason);
      if (outcome.status === "abandoned") summary.abandoned += 1;
      else summary.retryScheduled += 1;
    }
    store.log?.("order_comms_outbox_delivery_failed", {
      result: "failed",
      order_id: entry.orderId,
      kind: entry.kind,
      attempt: entry.attempt,
      reason,
    });
  }

  return summary;
}
