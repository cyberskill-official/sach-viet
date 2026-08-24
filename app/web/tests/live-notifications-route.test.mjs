import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("live notification stream route requires signed session and SSE headers", async () => {
  const stream = readFileSync(resolve(root, "src/app/api/notifications/stream/route.ts"), "utf8");
  assert.match(stream, /requireApiPermission/);
  assert.match(stream, /createOwnerNotificationSseStream/);
  assert.match(stream, /text\/event-stream/);
  assert.doesNotMatch(stream, /Pusher|Reverb|SMTP|Zalo|WebSocket/);
});

test("live notification core defines SSE transport without paid push providers", async () => {
  const source = readFileSync(resolve(root, "src/lib/live-notifications-core.mjs"), "utf8");
  assert.match(source, /formatSseFrame/);
  assert.match(source, /createOwnerNotificationSseStream/);
  assert.match(source, /subscribeLiveNotifications/);
  assert.match(source, /listNotificationsAfterCursor/);
  assert.doesNotMatch(source, /Pusher|Reverb|SMTP|Zalo|WebSocket/);
});
