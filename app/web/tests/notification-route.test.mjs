import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("notification routes use signed sessions and server-side repository calls", () => {
  const inbox = readFileSync(resolve(root, "src/app/api/notifications/route.ts"), "utf8");
  const preferences = readFileSync(resolve(root, "src/app/api/notifications/preferences/route.ts"), "utf8");
  const markRead = readFileSync(resolve(root, "src/app/api/notifications/[id]/read/route.ts"), "utf8");
  const vendorPreferences = readFileSync(resolve(root, "src/app/api/vendor/notification-preferences/route.ts"), "utf8");
  for (const source of [inbox, preferences, markRead, vendorPreferences]) assert.match(source, /readSession/);
  assert.match(inbox, /listNotifications/);
  assert.match(preferences, /getUserNotificationPreferences/);
  assert.match(preferences, /updateUserNotificationPreferences/);
  assert.match(markRead, /markNotificationRead/);
  assert.match(vendorPreferences, /getVendorNotificationPreferences/);
  assert.match(vendorPreferences, /updateVendorNotificationPreferences/);
  assert.doesNotMatch(inbox, /WebSocket|Pusher|Reverb|SMTP|Zalo/);
});
