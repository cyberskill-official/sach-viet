import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("admin integrations status route uses signed sessions and non-secret status helper", async () => {
  const source = readFileSync(resolve(root, "src/app/api/admin/integrations/status/route.ts"), "utf8");
  assert.match(source, /readSession/);
  assert.match(source, /getIntegrationStatus/);
  assert.doesNotMatch(source, /SMTP_PASSWORD|ZALO_OA_ACCESS_TOKEN|Resend|SendGrid|Mailgun/);
});

test("notification preference route still updates user preferences under signed sessions", async () => {
  const preferences = readFileSync(resolve(root, "src/app/api/notifications/preferences/route.ts"), "utf8");
  assert.match(preferences, /readSession/);
  assert.match(preferences, /updateUserNotificationPreferences/);
});
