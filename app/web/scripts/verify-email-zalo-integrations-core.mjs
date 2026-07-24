import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/email-zalo-integrations-core.mjs"), "utf8");
for (const required of [
  "createRecordingEmailTransport",
  "createRecordingZaloTransport",
  "createSmtpEmailTransport",
  "createZaloOaHttpTransport",
  "resolveEmailTransport",
  "resolveZaloTransport",
  "dispatchExternalNotificationChannels",
  "notification_delivery_attempts",
  "getIntegrationStatus",
  "recipient_hash",
  "recording",
  "smtp",
  "zalo_oa",
  "channel_disabled",
  "Admin access is required",
]) {
  if (!source.includes(required)) throw new Error(`Email/Zalo integrations core is missing ${required}.`);
}
if (/Resend|SendGrid|Mailgun|Postmark|@sendgrid|resend\(/i.test(source)) {
  throw new Error("Email/Zalo integrations must not lock a paid email SaaS SDK.");
}
if (/SMTP_PASSWORD|ZALO_OA_ACCESS_TOKEN/.test(source) && !source.includes("credentialPresence")) {
  throw new Error("Credential env names must only appear as presence checks or constructor inputs.");
}
const notificationCore = readFileSync(resolve(root, "src/lib/notification-core.mjs"), "utf8");
if (!notificationCore.includes("dispatchExternalNotificationChannels")) {
  throw new Error("Notification core must hook external channel dispatch after create.");
}
if (!notificationCore.includes("emailChannelEnabled") || !notificationCore.includes("zaloChannelEnabled")) {
  throw new Error("Notification preferences must support email and zalo channel toggles.");
}
if (/WebSocket|Pusher|Reverb|SMTP|Zalo/.test(notificationCore)) {
  throw new Error("Notification core must not embed SMTP/Zalo transport implementation.");
}
console.info(JSON.stringify({ event: "email_zalo_integrations_core_verified", task_id: "TASK-REBUILD-019", result: "passed" }));
