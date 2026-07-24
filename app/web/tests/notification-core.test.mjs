import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  NOTIFICATION_EVENT_TYPES,
  createNotification,
  createNotificationStore,
  getUserNotificationPreferences,
  getVendorNotificationPreferences,
  listEventTypes,
  listNotifications,
  markNotificationRead,
  updateUserNotificationPreferences,
  updateVendorNotificationPreferences,
} from "../src/lib/notification-core.mjs";

function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-notification-"));
  const dbPath = join(directory, "ops.sqlite");
  const events = [];
  const store = createNotificationStore({
    dbPath,
    clock: () => 4000,
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  try {
    return run({ store, events });
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("event registry seeds at least ten source-grounded trigger keys", () =>
  fixture(({ store }) => {
    assert.ok(NOTIFICATION_EVENT_TYPES.length >= 10);
    const types = listEventTypes(store, { id: "customer", role: "customer" });
    assert.equal(types.length, NOTIFICATION_EVENT_TYPES.length);
    assert.ok(types.some((row) => row.key === "order.paid"));
    assert.throws(() => listEventTypes(store, null), /Authentication/);
  }));

test("signed-in owner receives preference-gated notifications with badge and mark-read", () =>
  fixture(({ store, events }) => {
    const customer = { id: "customer", role: "customer" };
    const other = { id: "other", role: "customer" };
    const created = createNotification(store, customer, {
      userId: customer.id,
      eventType: "order.paid",
      title: "Order paid",
      body: "Your order is paid.",
      deeplinkPath: "/ecom/orders/1",
    });
    assert.equal(created.eventType, "order.paid");
    assert.equal(Object.hasOwn(created, "email"), false);
    assert.equal(Object.hasOwn(created, "sessionToken"), false);

    const listed = listNotifications(store, customer);
    assert.equal(listed.unreadCount, 1);
    assert.equal(listed.notifications.length, 1);
    assert.equal(listed.notifications[0].deeplinkPath, "/ecom/orders/1");

    const otherList = listNotifications(store, other);
    assert.equal(otherList.notifications.length, 0);
    assert.equal(otherList.unreadCount, 0);
    assert.throws(() => markNotificationRead(store, other, created.id), /Notification access/);

    const read = markNotificationRead(store, customer, created.id);
    assert.equal(read.isRead, true);
    assert.equal(listNotifications(store, customer).unreadCount, 0);
    assert.ok(events.some((row) => row.event === "notification_created"));
    assert.ok(events.some((row) => row.event === "notification_marked_read"));
  }));

test("user preferences and in_app channel gate notification creation", () =>
  fixture(({ store, events }) => {
    const customer = { id: "customer", role: "customer" };
    updateUserNotificationPreferences(store, customer, {
      preferences: [{ eventType: "order.paid", inAppEnabled: false }],
    });
    assert.equal(
      createNotification(store, customer, {
        userId: customer.id,
        eventType: "order.paid",
        title: "Skipped",
        body: "Should skip",
        deeplinkPath: "/ecom/orders/2",
      }),
      null,
    );
    assert.ok(events.some((row) => row.event === "notification_skipped"));

    updateUserNotificationPreferences(store, customer, {
      preferences: [{ eventType: "order.paid", inAppEnabled: true }],
      inAppChannelEnabled: false,
    });
    assert.equal(
      createNotification(store, customer, {
        userId: customer.id,
        eventType: "support.ticket_created",
        title: "Ticket",
        body: "Opened",
        deeplinkPath: "/ecom/support/1",
      }),
      null,
    );
    const prefs = getUserNotificationPreferences(store, customer);
    assert.equal(prefs.channels[0].channel, "in_app");
    assert.equal(prefs.channels[0].isEnabled, false);
  }));

test("unknown event types and absolute deeplinks are rejected", () =>
  fixture(({ store }) => {
    const customer = { id: "customer", role: "customer" };
    assert.throws(
      () =>
        createNotification(store, customer, {
          userId: customer.id,
          eventType: "email.blast",
          title: "Nope",
          body: "Nope",
          deeplinkPath: "/ecom",
        }),
      /Unknown notification event type/,
    );
    assert.throws(
      () =>
        createNotification(store, customer, {
          userId: customer.id,
          eventType: "order.paid",
          title: "Nope",
          body: "Nope",
          deeplinkPath: "https://evil.example/phish",
        }),
      /portal-relative/,
    );
  }));

test("vendor preferences require vendor or admin and default to enabled", () =>
  fixture(({ store }) => {
    const vendor = { id: "vendor", role: "vendor" };
    const customer = { id: "customer", role: "customer" };
    assert.throws(() => getVendorNotificationPreferences(store, customer), /Vendor access/);
    const defaults = getVendorNotificationPreferences(store, vendor);
    assert.equal(defaults.preferences.length, NOTIFICATION_EVENT_TYPES.length);
    assert.equal(defaults.preferences.every((row) => row.inAppEnabled === true), true);
    const updated = updateVendorNotificationPreferences(store, vendor, {
      preferences: [{ eventType: "payout.created", inAppEnabled: false }],
    });
    const payout = updated.preferences.find((row) => row.eventType === "payout.created");
    assert.equal(payout.inAppEnabled, false);
  }));
