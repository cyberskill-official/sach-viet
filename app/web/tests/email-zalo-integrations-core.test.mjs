import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  createRecordingEmailTransport,
  createRecordingZaloTransport,
  createSmtpEmailTransport,
  createZaloOaHttpTransport,
  getIntegrationStatus,
  listDeliveryAttempts,
  resolveEmailTransport,
  resolveZaloTransport,
} from "../src/lib/email-zalo-integrations-core.mjs";
import {
  createNotification,
  createNotificationStore,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "../src/lib/notification-core.mjs";

function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-email-zalo-"));
  const dbPath = join(directory, "ops.sqlite");
  const events = [];
  const store = createNotificationStore({
    dbPath,
    clock: () => 5000,
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  try {
    return run({ store, events });
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("disabled email and zalo channels skip without live transport calls", () =>
  fixture(({ store, events }) => {
    const customer = { id: "customer", role: "customer" };
    const notification = createNotification(store, customer, {
      userId: customer.id,
      eventType: "order.paid",
      title: "Paid",
      body: "Thanks",
      deeplinkPath: "/ecom/orders/1",
    });
    const attempts = listDeliveryAttempts(store, customer, notification.id);
    assert.equal(attempts.length, 2);
    assert.ok(attempts.every((row) => row.outcome === "skipped" && row.reason === "channel_disabled"));
    assert.ok(events.some((row) => row.event === "notification_delivery_attempted" && row.result === "skipped"));
  }));

test("enabled channels use recording stubs and omit raw recipients", () =>
  fixture(({ store, events }) => {
    const customer = { id: "customer", role: "customer" };
    updateUserNotificationPreferences(store, customer, {
      emailChannelEnabled: true,
      zaloChannelEnabled: true,
    });
    const prefs = getUserNotificationPreferences(store, customer);
    assert.equal(prefs.channels.find((row) => row.channel === "email").isEnabled, true);
    assert.equal(prefs.channels.find((row) => row.channel === "zalo").isEnabled, true);

    store.db.exec(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL, created_at INTEGER NOT NULL
    ) STRICT;`);
    store.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)").run(
      customer.id,
      "customer@example.com",
      "hash",
      "customer",
      1,
    );

    const notification = createNotification(store, customer, {
      userId: customer.id,
      eventType: "goods_request.created",
      title: "Goods request",
      body: "We received your request.",
      deeplinkPath: "/ecom/goods-requests/1",
    });
    const attempts = listDeliveryAttempts(store, customer, notification.id);
    assert.equal(attempts.length, 2);
    assert.ok(attempts.every((row) => row.outcome === "recorded" || row.outcome === "skipped"));
    const emailAttempt = attempts.find((row) => row.channel === "email");
    assert.equal(emailAttempt.outcome, "recorded");
    assert.equal(emailAttempt.recipientHash, createHash("sha256").update("customer@example.com").digest("hex").slice(0, 16));
    assert.equal(Object.hasOwn(emailAttempt, "email"), false);
    assert.ok(!JSON.stringify(events).includes("customer@example.com"));
    assert.ok(!JSON.stringify(events).includes("SMTP_PASSWORD"));
  }));

test("smtp and zalo seams skip missing recipients and record locally without submitters", () => {
  assert.throws(() => createSmtpEmailTransport({ host: "", from: "" }), /SMTP transport requires/);
  assert.throws(() => createZaloOaHttpTransport({ accessToken: "" }), /Zalo OA transport requires/);

  const events = [];
  const smtp = createSmtpEmailTransport({
    host: "smtp.example.test",
    port: "2525",
    user: "relay",
    password: "secret",
    from: "noreply@example.test",
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  assert.equal(smtp.send({ notificationId: "n0", recipient: null, title: "t", body: "b", deeplinkPath: "/" }).outcome, "skipped");
  assert.equal(
    smtp.send({ notificationId: "n1", recipient: "a@example.com", title: "t", body: "b", deeplinkPath: "/ecom" }).outcome,
    "recorded",
  );
  assert.ok(events.some((row) => row.event === "email_transport_smtp_local"));
  assert.ok(!JSON.stringify(events).includes("secret"));

  const failed = createSmtpEmailTransport({
    host: "smtp.example.test",
    from: "noreply@example.test",
    submit: () => ({ outcome: "failed", reason: "relay_down" }),
  });
  assert.equal(
    failed.send({ notificationId: "n2", recipient: "a@example.com", title: "t", body: "b", deeplinkPath: "/ecom" }).outcome,
    "failed",
  );

  const zaloEvents = [];
  const zalo = createZaloOaHttpTransport({
    accessToken: "token",
    log: (event, fields = {}) => zaloEvents.push({ event, ...fields }),
  });
  assert.equal(zalo.send({ notificationId: "z0", recipient: null, title: "t", body: "b", deeplinkPath: "/" }).outcome, "skipped");
  assert.equal(
    zalo.send({ notificationId: "z1", recipient: "zalo-user", title: "t", body: "b", deeplinkPath: "/ecom" }).outcome,
    "recorded",
  );
  assert.ok(zaloEvents.some((row) => row.event === "zalo_transport_oa_local"));
  assert.equal(
    createZaloOaHttpTransport({
      accessToken: "token",
      submit: () => ({ outcome: "failed", reason: "oa_down" }),
    }).send({ notificationId: "z2", recipient: "zalo-user", title: "t", body: "b", deeplinkPath: "/ecom" }).outcome,
    "failed",
  );
});

test("missing credentials keep recording mode; env seams switch mode without SaaS SDK", () => {
  const recordingEmail = resolveEmailTransport({});
  const recordingZalo = resolveZaloTransport({});
  assert.equal(recordingEmail.mode, "recording");
  assert.equal(recordingZalo.mode, "recording");

  const smtp = createSmtpEmailTransport({
    host: "smtp.example.test",
    from: "noreply@example.test",
    submit: () => ({ outcome: "sent", providerMessageId: "msg-1" }),
  });
  assert.equal(smtp.mode, "smtp");
  assert.equal(
    smtp.send({
      notificationId: "n1",
      recipient: "a@example.com",
      title: "Hi",
      body: "Body",
      deeplinkPath: "/ecom",
    }).outcome,
    "sent",
  );

  const zalo = createZaloOaHttpTransport({
    accessToken: "token-not-logged",
    submit: () => ({ outcome: "sent" }),
  });
  assert.equal(zalo.mode, "zalo_oa");
  assert.equal(
    zalo.send({
      notificationId: "n2",
      recipient: "zalo-user-1",
      title: "Hi",
      body: "Body",
      deeplinkPath: "/ecom",
    }).outcome,
    "sent",
  );

  assert.equal(createRecordingEmailTransport().mode, "recording");
  assert.equal(createRecordingZaloTransport().mode, "recording");
  assert.equal(resolveEmailTransport({ SMTP_HOST: "smtp.example.test", SMTP_FROM: "noreply@example.test" }).mode, "smtp");
  assert.equal(resolveZaloTransport({ ZALO_OA_ACCESS_TOKEN: "token" }).mode, "zalo_oa");
});

test("admin integration status is non-secret and rejects non-admins", () =>
  fixture(({ store }) => {
    assert.throws(() => getIntegrationStatus(store, { id: "customer", role: "customer" }), /Admin access/);
    const status = getIntegrationStatus(store, { id: "admin", role: "admin" }, {});
    assert.equal(status.emailTransport, "recording");
    assert.equal(status.zaloTransport, "recording");
    assert.equal(status.credentialPresence.smtpHost, false);
    assert.equal(status.credentialPresence.zaloOaAccessToken, false);
    assert.equal(Object.hasOwn(status, "SMTP_PASSWORD"), false);
    assert.equal(Object.hasOwn(status.credentialPresence, "rawToken"), false);

    const live = getIntegrationStatus(
      store,
      { id: "admin", role: "admin" },
      { SMTP_HOST: "smtp.example.test", SMTP_FROM: "noreply@example.test", ZALO_OA_ACCESS_TOKEN: "secret-token" },
    );
    assert.equal(live.emailTransport, "smtp");
    assert.equal(live.zaloTransport, "zalo_oa");
    assert.equal(live.credentialPresence.smtpHost, true);
    assert.equal(live.credentialPresence.zaloOaAccessToken, true);
    assert.ok(!JSON.stringify(live).includes("secret-token"));
  }));

test("foreign users cannot list delivery attempts", () =>
  fixture(({ store }) => {
    const customer = { id: "customer", role: "customer" };
    updateUserNotificationPreferences(store, customer, { emailChannelEnabled: true });
    const notification = createNotification(store, customer, {
      userId: customer.id,
      eventType: "order.paid",
      title: "Paid",
      body: "Thanks",
      deeplinkPath: "/ecom/orders/9",
    });
    assert.throws(() => listDeliveryAttempts(store, { id: "other", role: "customer" }, notification.id), /Notification access/);
  }));
