const subscribers = new Map();

export function encodeNotificationCursor(notification) {
  if (!notification?.id || notification.createdAt == null) throw new Error("Cursor requires id and createdAt.");
  return `${notification.createdAt}:${notification.id}`;
}

export function decodeNotificationCursor(cursor) {
  if (cursor == null || cursor === "") return null;
  if (typeof cursor !== "string" || !cursor.includes(":")) throw new Error("Invalid notification cursor.");
  const separator = cursor.indexOf(":");
  const createdAt = Number(cursor.slice(0, separator));
  const id = cursor.slice(separator + 1);
  if (!Number.isFinite(createdAt) || !id) throw new Error("Invalid notification cursor.");
  return { createdAt, id };
}

export function formatSseFrame(eventName, data) {
  return `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function buildLiveNotificationPayload(notification, unreadCount) {
  return {
    id: notification.id,
    eventType: notification.eventType,
    title: notification.title,
    body: notification.body,
    deeplinkPath: notification.deeplinkPath,
    isRead: Boolean(notification.isRead),
    createdAt: notification.createdAt,
    unreadCount: Number(unreadCount || 0),
    cursor: encodeNotificationCursor(notification),
  };
}

export function publishLiveNotification(userId, payload) {
  if (typeof userId !== "string" || userId.trim() === "") return 0;
  const listeners = subscribers.get(userId);
  if (!listeners || listeners.size === 0) return 0;
  let delivered = 0;
  for (const listener of listeners) {
    listener(payload);
    delivered += 1;
  }
  return delivered;
}

export function subscribeLiveNotifications(userId, listener) {
  if (typeof userId !== "string" || userId.trim() === "") throw new Error("Authentication is required.");
  if (typeof listener !== "function") throw new Error("Live notification listener is required.");
  let bucket = subscribers.get(userId);
  if (!bucket) {
    bucket = new Set();
    subscribers.set(userId, bucket);
  }
  bucket.add(listener);
  return () => {
    bucket.delete(listener);
    if (bucket.size === 0) subscribers.delete(userId);
  };
}

export function resetLiveNotificationBusForTests() {
  subscribers.clear();
}

export async function listNotificationsAfterCursor(store, user, cursor) {
  if (!user?.id) throw new Error("Authentication is required.");
  const decoded = decodeNotificationCursor(cursor);
  const rows = decoded
    ? await store.db
        .prepare(
          `
      SELECT id, user_id AS userId, event_type AS eventType, title, body, deeplink_path AS deeplinkPath,
             is_read AS isRead, created_at AS createdAt
      FROM notifications
      WHERE user_id = ?
        AND (created_at > ? OR (created_at = ? AND id > ?))
      ORDER BY created_at ASC, id ASC
    `,
        )
        .all(user.id, decoded.createdAt, decoded.createdAt, decoded.id)
    : await store.db
        .prepare(
          `
      SELECT id, user_id AS userId, event_type AS eventType, title, body, deeplink_path AS deeplinkPath,
             is_read AS isRead, created_at AS createdAt
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at ASC, id ASC
    `,
        )
        .all(user.id);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    eventType: row.eventType,
    title: row.title,
    body: row.body,
    deeplinkPath: row.deeplinkPath,
    isRead: row.isRead === 1 || row.isRead === true,
    createdAt: row.createdAt,
  }));
}

export async function unreadCountForUser(store, userId) {
  const unread = await store.db.prepare("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0").get(userId);
  return Number(unread?.count || 0);
}

export async function publishNotificationCreated(store, notification) {
  if (!notification?.userId || !notification?.id) return null;
  const payload = buildLiveNotificationPayload(notification, await unreadCountForUser(store, notification.userId));
  publishLiveNotification(notification.userId, payload);
  store.log?.("live_notification_published", {
    result: "accepted",
    notification_id: notification.id,
    user_id: notification.userId,
    event_type: notification.eventType,
  });
  return payload;
}

/**
 * @param {{
 *   store: { db: import("node:sqlite").DatabaseSync, close?: () => void, log?: Function },
 *   user: { id: string },
 *   cursor?: string | null,
 *   signal?: AbortSignal,
 *   heartbeatMs?: number,
 *   now?: () => number,
 *   onClose?: () => void,
 *   log?: (event: string, fields?: Record<string, unknown>) => void,
 * }} options
 */
export function createOwnerNotificationSseStream({
  store,
  user,
  cursor = null,
  signal,
  heartbeatMs = 15000,
  pollMs = 2000,
  now = () => Date.now(),
  onClose,
  log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-011", ...fields })),
} = {}) {
  if (!user?.id) throw new Error("Authentication is required.");
  const decodedCursor = cursor == null || cursor === "" ? null : decodeNotificationCursor(cursor);
  let closeLiveStream = () => {};

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (frame) => controller.enqueue(encoder.encode(frame));
      let closed = false;
      let unsubscribe = () => {};
      let heartbeat = null;
      let poll = null;

      const close = (reason = "closed") => {
        if (closed) return;
        closed = true;
        unsubscribe();
        if (heartbeat) clearInterval(heartbeat);
        if (poll) clearInterval(poll);
        try {
          controller.close();
        } catch {
          // already closed
        }
        try {
          onClose?.();
        } catch {
          // caller cleanup best-effort
        }
        log("live_notification_stream_closed", { result: reason, user_id: user.id });
      };
      closeLiveStream = close;

      if (signal) {
        if (signal.aborted) {
          close("aborted");
          return;
        }
        signal.addEventListener("abort", () => close("aborted"), { once: true });
      }

      try {
        const replay = decodedCursor
          ? await listNotificationsAfterCursor(store, user, `${decodedCursor.createdAt}:${decodedCursor.id}`)
          : [];
        for (const notification of replay) {
          enqueue(
            formatSseFrame(
              "notification",
              buildLiveNotificationPayload(notification, await unreadCountForUser(store, user.id)),
            ),
          );
        }
        enqueue(formatSseFrame("ready", { userId: user.id, resumed: Boolean(decodedCursor), at: now() }));
        log("live_notification_stream_opened", {
          result: "accepted",
          user_id: user.id,
          resumed: Boolean(decodedCursor),
          replay_count: replay.length,
        });

        unsubscribe = subscribeLiveNotifications(user.id, (payload) => {
          if (closed) return;
          enqueue(formatSseFrame("notification", payload));
        });

        let lastCursor = replay.length
          ? { createdAt: replay[replay.length - 1].createdAt, id: replay[replay.length - 1].id }
          : decodedCursor || { createdAt: now(), id: "-" };
        poll = setInterval(() => {
          if (closed) return;
          void listNotificationsAfterCursor(store, user, `${lastCursor.createdAt}:${lastCursor.id}`)
            .then(async (rows) => {
              for (const notification of rows) {
                if (closed) return;
                enqueue(
                  formatSseFrame(
                    "notification",
                    buildLiveNotificationPayload(notification, await unreadCountForUser(store, user.id)),
                  ),
                );
                lastCursor = { createdAt: notification.createdAt, id: notification.id };
              }
            })
            .catch(() => {});
        }, pollMs);

        heartbeat = setInterval(() => {
          if (closed) return;
          enqueue(formatSseFrame("heartbeat", { at: now() }));
        }, heartbeatMs);
      } catch (error) {
        log("live_notification_stream_failed", {
          result: "rejected",
          user_id: user.id,
          reason: error instanceof Error ? error.message : "stream_failed",
        });
        close("failed");
        throw error;
      }
    },
    cancel() {
      closeLiveStream("cancelled");
    },
  });
}
