import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/notification-core.mjs"), "utf8");
for (const required of [
  "notification_event_types",
  "user_notification_preferences",
  "vendor_notification_preferences",
  "user_channels",
  "NOTIFICATION_EVENT_TYPES",
  "createNotification",
  "listNotifications",
  "markNotificationRead",
  "updateUserNotificationPreferences",
  "updateVendorNotificationPreferences",
  "Authentication is required",
  "Notification access is denied",
  "preference_or_channel",
  "in_app",
]) {
  if (!source.includes(required)) throw new Error(`Notification core is missing ${required}.`);
}
if ((source.match(/order\.paid|support\.ticket_created|payout\.created/g) || []).length < 3) {
  throw new Error("Notification core is missing source-grounded event types.");
}
if (/WebSocket|Pusher|Reverb|SMTP|Zalo/.test(source)) {
  throw new Error("Notification core must not include live transport or external messaging.");
}
console.info(JSON.stringify({ event: "notification_core_verified", task_id: "TASK-REBUILD-010", result: "passed" }));
