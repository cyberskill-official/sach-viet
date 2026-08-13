import { randomBytes } from "node:crypto";
import { openDatabase } from "./db.mjs";
import { normalizeRole } from "./access.mjs";
import { dispatchExternalNotificationChannels } from "./email-zalo-integrations-core.mjs";
import { publishNotificationCreated } from "./live-notifications-core.mjs";

const identifier = () => randomBytes(16).toString("hex");
const required = (value, label) => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`);
  return value.trim();
};

export const NOTIFICATION_EVENT_TYPES = Object.freeze([
  "order.paid",
  "order.payment_failed",
  "support.ticket_created",
  "support.ticket_message",
  "goods_request.created",
  "product_review.created",
  "vendor.application_submitted",
  "vendor.application_decided",
  "vendor.offer_written",
  "payout.created",
  "payout.status_changed",
]);

const EVENT_TYPE_SET = new Set(NOTIFICATION_EVENT_TYPES);

function requireUser(user) {
  if (!user?.id) throw new Error("Authentication is required.");
  return user;
}

function requireVendor(user) {
  requireUser(user);
  const role = normalizeRole(user.role);
  if (role !== "vendor" && role !== "admin") throw new Error("Vendor access is required.");
  return user;
}

function assertEventType(eventType) {
  const key = required(eventType, "Event type");
  if (!EVENT_TYPE_SET.has(key)) throw new Error("Unknown notification event type.");
  return key;
}

function assertDeeplink(deeplinkPath) {
  const path = required(deeplinkPath, "Deeplink path");
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    throw new Error("Deeplink path must be a portal-relative path.");
  }
  return path;
}

function projectNotification(row) {
  return {
    id: row.id,
    userId: row.userId,
    eventType: row.eventType,
    title: row.title,
    body: row.body,
    deeplinkPath: row.deeplinkPath,
    isRead: row.isRead === 1 || row.isRead === true,
    createdAt: row.createdAt,
  };
}

export async function createNotificationStore({
  dbPath,
  clock = () => Date.now(),
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-010", ...fields })),
} = {}) {
  const db = await openDatabase(dbPath);
  const seed = db.prepare(
    "INSERT INTO notification_event_types (key, description, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
  );
  const now = clock();
  for (const key of NOTIFICATION_EVENT_TYPES) {
    await seed.run(key, key.replaceAll(".", " "), now);
  }
  return { db, clock, log, close: () => db.close() };
}

async function isInAppChannelEnabled(store, userId) {
  const row = await store.db.prepare("SELECT is_enabled AS isEnabled FROM user_channels WHERE user_id = ? AND channel = 'in_app'").get(userId);
  return row ? row.isEnabled === 1 : true;
}

async function isUserEventEnabled(store, userId, eventType) {
  const row = await store.db.prepare(
    "SELECT in_app_enabled AS inAppEnabled FROM user_notification_preferences WHERE user_id = ? AND event_type = ?",
  ).get(userId, eventType);
  return row ? row.inAppEnabled === 1 : true;
}

export async function listEventTypes(store, user) {
  requireUser(user);
  return await store.db.prepare("SELECT key, description, created_at AS createdAt FROM notification_event_types ORDER BY key ASC").all();
}

export async function createNotification(store, actor, input) {
  requireUser(actor);
  const userId = required(input?.userId, "User ID");
  const eventType = assertEventType(input?.eventType);
  const title = required(input?.title, "Title");
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (body.length > 4000) throw new Error("Notification body is too long.");
  const deeplinkPath = assertDeeplink(input?.deeplinkPath);

  if (!await isInAppChannelEnabled(store, userId) || !await isUserEventEnabled(store, userId, eventType)) {
    store.log("notification_skipped", { result: "skipped", event_type: eventType, user_id: userId, reason: "preference_or_channel" });
    return null;
  }

  const notification = {
    id: identifier(),
    userId,
    eventType,
    title,
    body,
    deeplinkPath,
    isRead: false,
    createdAt: store.clock(),
  };
  await store.db.prepare(`
    INSERT INTO notifications (id, user_id, event_type, title, body, deeplink_path, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(notification.id, notification.userId, notification.eventType, notification.title, notification.body, notification.deeplinkPath, notification.createdAt);
  store.log("notification_created", { result: "accepted", notification_id: notification.id, event_type: eventType, user_id: userId });
  await publishNotificationCreated(store, notification);
  await dispatchExternalNotificationChannels(store, notification);
  return notification;
}

export async function listNotifications(store, user, { after, limit } = {}) {
  requireUser(user);
  const clauses = ["user_id = ?"];
  const params = [user.id];
  if (after) {
    const cursor = await store.db
      .prepare("SELECT created_at AS createdAt, id FROM notifications WHERE id = ? AND user_id = ?")
      .get(after, user.id);
    if (cursor) {
      clauses.push("(created_at, id) < (?, ?)");
      params.push(cursor.createdAt, cursor.id);
    }
  }
  const capped = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : null;
  let sql = `
    SELECT id, user_id AS userId, event_type AS eventType, title, body, deeplink_path AS deeplinkPath,
           is_read AS isRead, created_at AS createdAt
    FROM notifications
    WHERE ${clauses.join(" AND ")}
    ORDER BY created_at DESC, id DESC
  `;
  if (capped) {
    sql += " LIMIT ?";
    params.push(capped);
  }
  const notifications = (await store.db.prepare(sql).all(...params)).map(projectNotification);
  const unread = await store.db.prepare("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0").get(user.id);
  return { notifications, unreadCount: Number(unread?.count || 0) };
}

export async function markNotificationRead(store, user, notificationId) {
  requireUser(user);
  const id = required(notificationId, "Notification ID");
  const existing = await store.db.prepare("SELECT id, user_id AS userId, is_read AS isRead FROM notifications WHERE id = ?").get(id);
  if (!existing || existing.userId !== user.id) throw new Error("Notification access is denied.");
  if (existing.isRead === 1) {
    return projectNotification(await store.db.prepare(`
      SELECT id, user_id AS userId, event_type AS eventType, title, body, deeplink_path AS deeplinkPath,
             is_read AS isRead, created_at AS createdAt
      FROM notifications WHERE id = ?
    `).get(id));
  }
  await store.db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?").run(id, user.id);
  store.log("notification_marked_read", { result: "accepted", notification_id: id, user_id: user.id });
  return projectNotification(await store.db.prepare(`
    SELECT id, user_id AS userId, event_type AS eventType, title, body, deeplink_path AS deeplinkPath,
           is_read AS isRead, created_at AS createdAt
    FROM notifications WHERE id = ?
  `).get(id));
}

function defaultPreferenceRows(userKeyField, userId) {
  return NOTIFICATION_EVENT_TYPES.map((eventType) => ({
    [userKeyField]: userId,
    eventType,
    inAppEnabled: true,
  }));
}

export async function getUserNotificationPreferences(store, user) {
  requireUser(user);
  const rows = await store.db.prepare(`
    SELECT user_id AS userId, event_type AS eventType, in_app_enabled AS inAppEnabled, updated_at AS updatedAt
    FROM user_notification_preferences
    WHERE user_id = ?
    ORDER BY event_type ASC
  `).all(user.id);
  const byType = new Map(rows.map((row) => [row.eventType, { ...row, inAppEnabled: row.inAppEnabled === 1 }]));
  const preferences = defaultPreferenceRows("userId", user.id).map((fallback) => byType.get(fallback.eventType) || fallback);
  const channelRows = await store.db
    .prepare("SELECT user_id AS userId, channel, is_enabled AS isEnabled, updated_at AS updatedAt FROM user_channels WHERE user_id = ?")
    .all(user.id);
  const byChannel = new Map(channelRows.map((row) => [row.channel, row]));
  const channelNames = ["in_app", "email", "zalo"];
  return {
    preferences,
    channels: channelNames.map((channel) => {
      const row = byChannel.get(channel);
      if (row) {
        return {
          userId: row.userId,
          channel: row.channel,
          isEnabled: row.isEnabled === 1,
          updatedAt: row.updatedAt,
        };
      }
      return {
        userId: user.id,
        channel,
        isEnabled: channel === "in_app",
      };
    }),
  };
}

export async function updateUserNotificationPreferences(store, user, input) {
  requireUser(user);
  const updates = Array.isArray(input?.preferences) ? input.preferences : [];
  const timestamp = store.clock();
  for (const item of updates) {
    const eventType = assertEventType(item?.eventType);
    const inAppEnabled = item?.inAppEnabled === false ? 0 : 1;
    await store.db.prepare(`
      INSERT INTO user_notification_preferences (user_id, event_type, in_app_enabled, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, event_type) DO UPDATE SET in_app_enabled = excluded.in_app_enabled, updated_at = excluded.updated_at
    `).run(user.id, eventType, inAppEnabled, timestamp);
  }
  const channelUpdates = [
    ["inAppChannelEnabled", "in_app"],
    ["emailChannelEnabled", "email"],
    ["zaloChannelEnabled", "zalo"],
  ];
  for (const [field, channel] of channelUpdates) {
    if (!Object.hasOwn(input || {}, field)) continue;
    const isEnabled = input[field] === false ? 0 : 1;
    await store.db.prepare(`
      INSERT INTO user_channels (user_id, channel, is_enabled, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, channel) DO UPDATE SET is_enabled = excluded.is_enabled, updated_at = excluded.updated_at
    `).run(user.id, channel, isEnabled, timestamp);
    store.log("user_channel_updated", { result: "accepted", user_id: user.id, channel, is_enabled: isEnabled === 1 });
  }
  store.log("user_notification_preferences_updated", { result: "accepted", user_id: user.id, updated_count: updates.length });
  return await getUserNotificationPreferences(store, user);
}

export async function getVendorNotificationPreferences(store, user) {
  requireVendor(user);
  const vendorId = user.id;
  const rows = await store.db.prepare(`
    SELECT vendor_id AS vendorId, event_type AS eventType, in_app_enabled AS inAppEnabled, updated_at AS updatedAt
    FROM vendor_notification_preferences
    WHERE vendor_id = ?
    ORDER BY event_type ASC
  `).all(vendorId);
  const byType = new Map(rows.map((row) => [row.eventType, { ...row, inAppEnabled: row.inAppEnabled === 1 }]));
  return {
    preferences: defaultPreferenceRows("vendorId", vendorId).map((fallback) => byType.get(fallback.eventType) || fallback),
  };
}

export async function updateVendorNotificationPreferences(store, user, input) {
  requireVendor(user);
  const updates = Array.isArray(input?.preferences) ? input.preferences : [];
  const timestamp = store.clock();
  for (const item of updates) {
    const eventType = assertEventType(item?.eventType);
    const inAppEnabled = item?.inAppEnabled === false ? 0 : 1;
    await store.db.prepare(`
      INSERT INTO vendor_notification_preferences (vendor_id, event_type, in_app_enabled, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(vendor_id, event_type) DO UPDATE SET in_app_enabled = excluded.in_app_enabled, updated_at = excluded.updated_at
    `).run(user.id, eventType, inAppEnabled, timestamp);
  }
  store.log("vendor_notification_preferences_updated", { result: "accepted", vendor_id: user.id, updated_count: updates.length });
  return await getVendorNotificationPreferences(store, user);
}
