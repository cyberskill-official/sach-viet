import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildLiveNotificationPayload,
  createOwnerNotificationSseStream,
  decodeNotificationCursor,
  encodeNotificationCursor,
  formatSseFrame,
  listNotificationsAfterCursor,
  publishLiveNotification,
  resetLiveNotificationBusForTests,
  subscribeLiveNotifications,
} from "../src/lib/live-notifications-core.mjs";
import { createNotification, createNotificationStore } from "../src/lib/notification-core.mjs";

async function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-live-notification-"));
  const dbPath = join(directory, "ops.sqlite");
  const events = [];
  resetLiveNotificationBusForTests();
  const store = createNotificationStore({
    dbPath,
    clock: (() => {
      let tick = 5000;
      return () => {
        tick += 1;
        return tick;
      };
    })(),
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  try {
    return await run({ store, events });
  } finally {
    store.close();
    resetLiveNotificationBusForTests();
    rmSync(directory, { recursive: true, force: true });
  }
}

async function readFrames(stream, count) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const frames = [];
  while (frames.length < count) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      if (part.trim()) frames.push(part);
    }
  }
  await reader.cancel();
  return frames;
}

test("cursor helpers and sse framing omit secrets", () => {
  const payload = buildLiveNotificationPayload(
    {
      id: "n1",
      eventType: "order.paid",
      title: "Paid",
      body: "Thanks",
      deeplinkPath: "/ecom/orders/1",
      isRead: false,
      createdAt: 42,
    },
    3,
  );
  assert.equal(payload.cursor, "42:n1");
  assert.equal(payload.unreadCount, 3);
  assert.equal(Object.hasOwn(payload, "email"), false);
  assert.equal(Object.hasOwn(payload, "sessionToken"), false);
  assert.deepEqual(decodeNotificationCursor(encodeNotificationCursor({ id: "n1", createdAt: 42 })), {
    createdAt: 42,
    id: "n1",
  });
  assert.match(formatSseFrame("notification", payload), /^event: notification\ndata: \{/);
  assert.throws(() => decodeNotificationCursor("bad"), /Invalid notification cursor/);
});

test("createNotification publishes only to the owner live subscribers", async () =>
  fixture(async ({ store, events }) => {
    const customer = { id: "customer", role: "customer" };
    const other = { id: "other", role: "customer" };
    const ownerEvents = [];
    const otherEvents = [];
    const unsubscribeOwner = subscribeLiveNotifications(customer.id, (payload) => ownerEvents.push(payload));
    const unsubscribeOther = subscribeLiveNotifications(other.id, (payload) => otherEvents.push(payload));

    const created = createNotification(store, customer, {
      userId: customer.id,
      eventType: "order.paid",
      title: "Order paid",
      body: "Your order is paid.",
      deeplinkPath: "/ecom/orders/1",
    });
    assert.equal(ownerEvents.length, 1);
    assert.equal(ownerEvents[0].id, created.id);
    assert.equal(ownerEvents[0].unreadCount, 1);
    assert.equal(otherEvents.length, 0);
    assert.ok(events.some((row) => row.event === "live_notification_published"));

    unsubscribeOwner();
    unsubscribeOther();
    assert.equal(publishLiveNotification(customer.id, { id: "ignored" }), 0);
  }));

test("cursor resume returns only newer owner-scoped notifications", async () =>
  fixture(async ({ store }) => {
    const customer = { id: "customer", role: "customer" };
    const other = { id: "other", role: "customer" };
    const first = createNotification(store, customer, {
      userId: customer.id,
      eventType: "order.paid",
      title: "First",
      body: "one",
      deeplinkPath: "/ecom/orders/1",
    });
    createNotification(store, other, {
      userId: other.id,
      eventType: "order.paid",
      title: "Other",
      body: "secret",
      deeplinkPath: "/ecom/orders/9",
    });
    const second = createNotification(store, customer, {
      userId: customer.id,
      eventType: "support.ticket_created",
      title: "Second",
      body: "two",
      deeplinkPath: "/support/tickets/1",
    });
    const after = listNotificationsAfterCursor(store, customer, encodeNotificationCursor(first));
    assert.equal(after.length, 1);
    assert.equal(after[0].id, second.id);
    assert.throws(() => listNotificationsAfterCursor(store, null, encodeNotificationCursor(first)), /Authentication/);
  }));

test("authenticated SSE stream replays from cursor and receives live events", async () =>
  fixture(async ({ store }) => {
    const customer = { id: "customer", role: "customer" };
    const first = createNotification(store, customer, {
      userId: customer.id,
      eventType: "order.paid",
      title: "First",
      body: "one",
      deeplinkPath: "/ecom/orders/1",
    });
    const stream = createOwnerNotificationSseStream({
      store,
      user: customer,
      cursor: encodeNotificationCursor(first),
      heartbeatMs: 60_000,
      log: () => {},
    });
    const livePromise = readFrames(stream, 2);
    await new Promise((resolve) => setTimeout(resolve, 20));
    createNotification(store, customer, {
      userId: customer.id,
      eventType: "payout.created",
      title: "Live",
      body: "pushed",
      deeplinkPath: "/vendor/payouts/1",
    });
    const frames = await livePromise;
    assert.ok(frames.some((frame) => frame.includes("event: ready")));
    assert.ok(frames.some((frame) => frame.includes("Live") && frame.includes("payout.created")));
    assert.ok(!frames.some((frame) => /email|sessionToken|paymentSecret/i.test(frame)));
  }));

test("unauthenticated stream open fails", () => {
  assert.throws(
    () =>
      createOwnerNotificationSseStream({
        store: { close: () => {} },
        user: null,
      }),
    /Authentication/,
  );
});

test("SSE stream heartbeats and closes on abort", async () =>
  fixture(async ({ store }) => {
    const customer = { id: "customer", role: "customer" };
    const controller = new AbortController();
    const stream = createOwnerNotificationSseStream({
      store,
      user: customer,
      heartbeatMs: 20,
      signal: controller.signal,
      log: () => {},
    });
    const frames = await readFrames(stream, 2);
    assert.ok(frames.some((frame) => frame.includes("event: ready")));
    assert.ok(frames.some((frame) => frame.includes("event: heartbeat")));
    controller.abort();
  }));

test("list without cursor returns owner inbox chronologically", async () =>
  fixture(async ({ store }) => {
    const customer = { id: "customer", role: "customer" };
    createNotification(store, customer, {
      userId: customer.id,
      eventType: "order.paid",
      title: "A",
      body: "a",
      deeplinkPath: "/ecom/orders/1",
    });
    createNotification(store, customer, {
      userId: customer.id,
      eventType: "order.paid",
      title: "B",
      body: "b",
      deeplinkPath: "/ecom/orders/2",
    });
    const listed = listNotificationsAfterCursor(store, customer, null);
    assert.equal(listed.length, 2);
    assert.ok(listed[0].createdAt <= listed[1].createdAt);
  }));
