import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/live-notifications-core.mjs"), "utf8");
const route = readFileSync(resolve(root, "src/app/api/notifications/stream/route.ts"), "utf8");
const notificationCore = readFileSync(resolve(root, "src/lib/notification-core.mjs"), "utf8");

for (const required of [
  "formatSseFrame",
  "createOwnerNotificationSseStream",
  "subscribeLiveNotifications",
  "publishNotificationCreated",
  "listNotificationsAfterCursor",
  "encodeNotificationCursor",
  "heartbeat",
  "Authentication is required",
]) {
  if (!source.includes(required)) throw new Error(`Live notification core is missing ${required}.`);
}

if (!route.includes("text/event-stream")) throw new Error("Stream route must emit SSE content type.");
if (!route.includes("readSession")) throw new Error("Stream route must require a signed session.");
if (!notificationCore.includes("publishNotificationCreated")) {
  throw new Error("Notification core must publish live events after create.");
}
if (/Pusher|Reverb|SMTP|Zalo|WebSocket/.test(`${source}\n${route}`)) {
  throw new Error("Live notifications must not include Pusher, Reverb, WebSocket, SMTP, or Zalo.");
}

console.info(JSON.stringify({ event: "live_notifications_core_verified", task_id: "TASK-REBUILD-011", result: "passed" }));
