import { createHash, randomBytes } from "node:crypto";
import { normalizeRole } from "./access.mjs";

const identifier = () => randomBytes(16).toString("hex");

function required(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`);
  return value.trim();
}

function requireUser(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  return user;
}

function requireAdmin(user) {
  requireUser(user);
  if (normalizeRole(user.role) !== "admin") throw new Error("Admin access is required.");
  return user;
}

function redactRecipient(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export const EXTERNAL_CHANNELS = Object.freeze(["email", "zalo"]);

export function createRecordingEmailTransport({ log } = {}) {
  return {
    mode: "recording",
    send(message) {
      log?.("email_transport_recorded", {
        result: "recorded",
        channel: "email",
        notification_id: message.notificationId,
        recipient_hash: redactRecipient(message.recipient),
      });
      return { outcome: "recorded", providerMessageId: null };
    },
  };
}

export function createRecordingZaloTransport({ log } = {}) {
  return {
    mode: "recording",
    send(message) {
      log?.("zalo_transport_recorded", {
        result: "recorded",
        channel: "zalo",
        notification_id: message.notificationId,
        recipient_hash: redactRecipient(message.recipient),
      });
      return { outcome: "recorded", providerMessageId: null };
    },
  };
}

export function createSmtpEmailTransport({
  host = process.env.SMTP_HOST,
  port = process.env.SMTP_PORT,
  user = process.env.SMTP_USER,
  password = process.env.SMTP_PASSWORD,
  from = process.env.SMTP_FROM,
  submit = null,
  log,
} = {}) {
  if (!host || !from) {
    throw new Error("SMTP transport requires SMTP_HOST and SMTP_FROM.");
  }
  return {
    mode: "smtp",
    send(message) {
      if (!message.recipient) {
        return { outcome: "skipped", reason: "missing_recipient" };
      }
      // Vendor-agnostic seam: deployments may inject a sync submitter for any SMTP relay.
      // Default greenfield path records locally without a paid SaaS SDK or network I/O.
      if (typeof submit === "function") {
        const result = submit({
          host,
          port: Number(port || 587),
          user: user || undefined,
          passwordConfigured: Boolean(password),
          from,
          toHash: redactRecipient(message.recipient),
          subject: message.title,
          text: `${message.body}\n${message.deeplinkPath}`,
        });
        const outcome = result?.outcome === "failed" ? "failed" : "sent";
        log?.("email_transport_smtp_submitted", {
          result: outcome,
          channel: "email",
          notification_id: message.notificationId,
          recipient_hash: redactRecipient(message.recipient),
        });
        return { outcome, reason: result?.reason || null, providerMessageId: result?.providerMessageId || null };
      }
      log?.("email_transport_smtp_local", {
        result: "recorded",
        channel: "email",
        notification_id: message.notificationId,
        recipient_hash: redactRecipient(message.recipient),
        smtp_host_configured: Boolean(host),
        smtp_port_configured: Boolean(port),
        smtp_user_configured: Boolean(user),
        smtp_password_configured: Boolean(password),
      });
      return { outcome: "recorded", providerMessageId: null };
    },
  };
}

export function createZaloOaHttpTransport({
  accessToken = process.env.ZALO_OA_ACCESS_TOKEN,
  apiBase = process.env.ZALO_OA_API_BASE || "https://openapi.zalo.me",
  submit = null,
  log,
} = {}) {
  if (!accessToken) throw new Error("Zalo OA transport requires ZALO_OA_ACCESS_TOKEN.");
  return {
    mode: "zalo_oa",
    send(message) {
      if (!message.recipient) {
        return { outcome: "skipped", reason: "missing_recipient" };
      }
      // Live path is an injected sync submitter only. Token never enters attempt rows/events.
      if (typeof submit === "function") {
        const result = submit({
          apiBase,
          recipientHash: redactRecipient(message.recipient),
          text: `${message.title}\n${message.body}\n${message.deeplinkPath}`,
        });
        const outcome = result?.outcome === "failed" ? "failed" : "sent";
        log?.("zalo_transport_oa_submitted", {
          result: outcome,
          channel: "zalo",
          notification_id: message.notificationId,
          recipient_hash: redactRecipient(message.recipient),
        });
        return { outcome, reason: result?.reason || null, providerMessageId: result?.providerMessageId || null };
      }
      log?.("zalo_transport_oa_local", {
        result: "recorded",
        channel: "zalo",
        notification_id: message.notificationId,
        recipient_hash: redactRecipient(message.recipient),
        api_base_configured: Boolean(apiBase),
        token_configured: true,
      });
      return { outcome: "recorded", providerMessageId: null };
    },
  };
}

export function resolveEmailTransport(env = process.env, { log } = {}) {
  if (env.SMTP_HOST && env.SMTP_FROM) {
    try {
      return createSmtpEmailTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
        from: env.SMTP_FROM,
        log,
      });
    } catch {
      return createRecordingEmailTransport({ log });
    }
  }
  return createRecordingEmailTransport({ log });
}

export function resolveZaloTransport(env = process.env, { log } = {}) {
  if (env.ZALO_OA_ACCESS_TOKEN) {
    try {
      return createZaloOaHttpTransport({
        accessToken: env.ZALO_OA_ACCESS_TOKEN,
        apiBase: env.ZALO_OA_API_BASE,
        log,
      });
    } catch {
      return createRecordingZaloTransport({ log });
    }
  }
  return createRecordingZaloTransport({ log });
}

export function ensureExternalDeliverySchema(store) {
  store.db.exec(`
    CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
      id TEXT PRIMARY KEY,
      notification_id TEXT NOT NULL,
      channel TEXT NOT NULL CHECK (channel IN ('email', 'zalo')),
      outcome TEXT NOT NULL CHECK (outcome IN ('recorded', 'sent', 'skipped', 'failed')),
      reason TEXT,
      recipient_hash TEXT,
      created_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS notification_delivery_attempts_notification_idx
      ON notification_delivery_attempts(notification_id, created_at DESC);
  `);
}

function isExternalChannelEnabled(store, userId, channel) {
  const row = store.db
    .prepare("SELECT is_enabled AS isEnabled FROM user_channels WHERE user_id = ? AND channel = ?")
    .get(userId, channel);
  return row ? row.isEnabled === 1 : false;
}

function lookupUserEmail(store, userId) {
  try {
    const row = store.db.prepare("SELECT email FROM users WHERE id = ?").get(userId);
    return typeof row?.email === "string" ? row.email : null;
  } catch {
    return null;
  }
}

function lookupZaloEndpoint(store, userId) {
  try {
    const row = store.db
      .prepare("SELECT endpoint FROM user_channel_endpoints WHERE user_id = ? AND channel = 'zalo'")
      .get(userId);
    return typeof row?.endpoint === "string" ? row.endpoint : null;
  } catch {
    return null;
  }
}

function recordAttempt(store, { notificationId, channel, outcome, reason = null, recipientHash = null }) {
  const attempt = {
    id: identifier(),
    notificationId,
    channel,
    outcome,
    reason,
    recipientHash,
    createdAt: store.clock(),
  };
  store.db
    .prepare(
      `
    INSERT INTO notification_delivery_attempts
      (id, notification_id, channel, outcome, reason, recipient_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      attempt.id,
      attempt.notificationId,
      attempt.channel,
      attempt.outcome,
      attempt.reason,
      attempt.recipientHash,
      attempt.createdAt,
    );
  store.log("notification_delivery_attempted", {
    result: outcome,
    notification_id: notificationId,
    channel,
    reason: reason || undefined,
    recipient_hash: recipientHash || undefined,
    task_id: "TASK-REBUILD-019",
  });
  return attempt;
}

export function dispatchExternalNotificationChannels(
  store,
  notification,
  {
    emailTransport = resolveEmailTransport(process.env, { log: store.log }),
    zaloTransport = resolveZaloTransport(process.env, { log: store.log }),
    resolveEmail = lookupUserEmail,
    resolveZalo = lookupZaloEndpoint,
  } = {},
) {
  if (!notification?.id || !notification?.userId) return [];
  ensureExternalDeliverySchema(store);
  const attempts = [];
  const payload = {
    notificationId: notification.id,
    title: notification.title,
    body: notification.body,
    deeplinkPath: notification.deeplinkPath,
    eventType: notification.eventType,
  };

  for (const channel of EXTERNAL_CHANNELS) {
    if (!isExternalChannelEnabled(store, notification.userId, channel)) {
      attempts.push(
        recordAttempt(store, {
          notificationId: notification.id,
          channel,
          outcome: "skipped",
          reason: "channel_disabled",
        }),
      );
      continue;
    }

    const recipient = channel === "email" ? resolveEmail(store, notification.userId) : resolveZalo(store, notification.userId);
    const transport = channel === "email" ? emailTransport : zaloTransport;
    const result = transport.send({ ...payload, recipient });
    const outcome = result?.outcome || "failed";
    attempts.push(
      recordAttempt(store, {
        notificationId: notification.id,
        channel,
        outcome,
        reason: result?.reason || null,
        recipientHash: redactRecipient(recipient),
      }),
    );
  }
  return attempts;
}

export function listDeliveryAttempts(store, user, notificationId) {
  requireUser(user);
  ensureExternalDeliverySchema(store);
  const id = required(notificationId, "Notification ID");
  const owned = store.db.prepare("SELECT id, user_id AS userId FROM notifications WHERE id = ?").get(id);
  if (!owned || owned.userId !== user.id) throw new Error("Notification access is denied.");
  return store.db
    .prepare(
      `
    SELECT id, notification_id AS notificationId, channel, outcome, reason,
           recipient_hash AS recipientHash, created_at AS createdAt
    FROM notification_delivery_attempts
    WHERE notification_id = ?
    ORDER BY created_at ASC, id ASC
  `,
    )
    .all(id);
}

export function getIntegrationStatus(store, user, env = process.env) {
  requireAdmin(user);
  const emailTransport = resolveEmailTransport(env, { log: store.log });
  const zaloTransport = resolveZaloTransport(env, { log: store.log });
  return {
    emailTransport: emailTransport.mode,
    zaloTransport: zaloTransport.mode,
    credentialPresence: {
      smtpHost: Boolean(env.SMTP_HOST),
      smtpFrom: Boolean(env.SMTP_FROM),
      smtpUser: Boolean(env.SMTP_USER),
      smtpPassword: Boolean(env.SMTP_PASSWORD),
      zaloOaAccessToken: Boolean(env.ZALO_OA_ACCESS_TOKEN),
    },
  };
}
