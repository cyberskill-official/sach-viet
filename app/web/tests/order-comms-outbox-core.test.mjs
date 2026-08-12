import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import { createCommerceStore, createPendingOrder, processStripeWebhook } from "../src/lib/commerce-core.mjs";
import { createSmtpEmailTransport, createRecordingEmailTransport } from "../src/lib/email-zalo-integrations-core.mjs";
import { processOrderCommsOutbox } from "../src/lib/order-comms-core.mjs";
import { ORDER_COMMS_MAX_ATTEMPTS, getOrderCommsEntry } from "../src/lib/order-comms-outbox-core.mjs";

const WEBHOOK_SECRET = "whsec_test_secret_value";

function sendingEmailTransport() {
  return createSmtpEmailTransport({
    host: "smtp.example.test",
    from: "orders@example.test",
    submit: () => ({ outcome: "sent", providerMessageId: "msg_outbox" }),
  });
}

async function withPendingOrder(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-order-outbox-"));
  const dbPath = join(directory, "sachviet.sqlite");
  const events = [];
  let currentTime = 1000;
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const commerce = await createCommerceStore({
    dbPath,
    log: (event, fields = {}) => events.push({ event, ...fields }),
    clock: () => currentTime,
  });
  try {
    await createCategory(catalog, { slug: "books", name: "Books" });
    const product = await createProduct(catalog, { categorySlug: "books", slug: "book", title: "A Book" });
    const offer = await writeVendorOffer(catalog, { id: "vendor-1", role: "vendor" }, {
      productId: product.id,
      vendorId: "vendor-1",
      priceUsd: "10.00",
      stockQuantity: 3,
    });
    const user = { id: "customer-1", role: "customer" };
    await commerce.db
      .prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(user.id, "customer@example.test", "hash", "customer", 1);
    const order = await createPendingOrder(commerce, user, [{ vendorOfferId: offer.id, quantity: 1 }]);
    return await run({
      commerce,
      order,
      user,
      events,
      advanceTo: (value) => {
        currentTime = value;
      },
      now: () => currentTime,
    });
  } finally {
    await commerce.close();
    await catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

async function completeCheckout(commerce, orderId) {
  const payload = JSON.stringify({
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_1", metadata: { order_id: orderId } } },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `t=${timestamp},v1=${createHmac("sha256", WEBHOOK_SECRET).update(`${timestamp}.${payload}`).digest("hex")}`;
  return await processStripeWebhook(commerce, payload, signature, WEBHOOK_SECRET);
}

async function drain(commerce, orderId, dispatchOverride) {
  return await processOrderCommsOutbox(commerce, {
    orderId,
    ...(dispatchOverride ? { dispatch: dispatchOverride } : {}),
    dispatchOptions: {
      env: { SMTP_HOST: "smtp.example.test", SMTP_FROM: "orders@example.test" },
      emailTransport: sendingEmailTransport(),
    },
  });
}

/** Confirmation emails actually handed to a live transport (`sent` only). */
async function emailAttemptCount(commerce) {
  return Number(
    (await commerce.db
      .prepare(
        "SELECT COUNT(*) AS count FROM notification_delivery_attempts WHERE channel = 'email' AND outcome = 'sent'",
      )
      .get()).count,
  );
}

test("paying an order enqueues confirmation comms and the outbox delivers exactly once", async () =>
  withPendingOrder(async ({ commerce, order }) => {
    const webhook = await completeCheckout(commerce, order.id);
    assert.equal(webhook.updated, true);
    assert.equal(webhook.enqueued, true);
    assert.equal((await getOrderCommsEntry(commerce, order.id)).status, "pending");

    assert.deepEqual(await drain(commerce, order.id), { claimed: 1, delivered: 1, retryScheduled: 0, abandoned: 0 });
    assert.equal((await getOrderCommsEntry(commerce, order.id)).status, "delivered");
    assert.equal(await emailAttemptCount(commerce), 1);

    // A Stripe replay must not resurrect delivered work or resend the confirmation.
    const replay = await completeCheckout(commerce, order.id);
    assert.equal(replay.updated, false);
    assert.equal(replay.paid, true);
    assert.equal(replay.enqueued, false);
    assert.deepEqual(await drain(commerce, order.id), { claimed: 0, delivered: 0, retryScheduled: 0, abandoned: 0 });
    assert.equal(await emailAttemptCount(commerce), 1);
  }));

test("a dispatch failure after the order is paid leaves the confirmation queued for retry", async () =>
  withPendingOrder(async ({ commerce, order, advanceTo }) => {
    await completeCheckout(commerce, order.id);

    const summary = await drain(commerce, order.id, () => {
      throw new Error("smtp_unreachable");
    });
    assert.deepEqual(summary, { claimed: 1, delivered: 0, retryScheduled: 1, abandoned: 0 });

    const queued = await getOrderCommsEntry(commerce, order.id);
    assert.equal(queued.status, "pending");
    assert.equal(queued.attempts, 1);
    assert.equal(queued.lastError, "smtp_unreachable");
    assert.ok(queued.availableAt > 1000, "retry should be scheduled into the future");
    assert.equal(await emailAttemptCount(commerce), 0);

    advanceTo(queued.availableAt);
    assert.deepEqual(await drain(commerce, order.id), { claimed: 1, delivered: 1, retryScheduled: 0, abandoned: 0 });
    assert.equal((await getOrderCommsEntry(commerce, order.id)).status, "delivered");
    assert.equal(await emailAttemptCount(commerce), 1);
  }));

test("a webhook replay delivers the confirmation even though the paid update is idempotent", async () =>
  withPendingOrder(async ({ commerce, order, advanceTo }) => {
    await completeCheckout(commerce, order.id);
    await drain(commerce, order.id, () => {
      throw new Error("smtp_unreachable");
    });
    assert.equal(await emailAttemptCount(commerce), 0);

    // This is the F-004 loss scenario: the second webhook updates nothing, and the old
    // `result.updated` guard would have skipped dispatch forever.
    advanceTo((await getOrderCommsEntry(commerce, order.id)).availableAt);
    const replay = await completeCheckout(commerce, order.id);
    assert.equal(replay.updated, false);
    assert.deepEqual(await drain(commerce, order.id), { claimed: 1, delivered: 1, retryScheduled: 0, abandoned: 0 });
    assert.equal(await emailAttemptCount(commerce), 1);
  }));

test("the outbox dead-letters a confirmation once its attempts are exhausted", async () =>
  withPendingOrder(async ({ commerce, order, advanceTo }) => {
    await completeCheckout(commerce, order.id);
    const fail = () => {
      throw new Error("smtp_unreachable");
    };
    for (let attempt = 1; attempt <= ORDER_COMMS_MAX_ATTEMPTS; attempt += 1) {
      await drain(commerce, order.id, fail);
      advanceTo((await getOrderCommsEntry(commerce, order.id)).availableAt);
    }
    const entry = await getOrderCommsEntry(commerce, order.id);
    assert.equal(entry.attempts, ORDER_COMMS_MAX_ATTEMPTS);
    assert.equal(entry.status, "abandoned");
    assert.deepEqual(await drain(commerce, order.id), { claimed: 0, delivered: 0, retryScheduled: 0, abandoned: 0 });
  }));

test("an unknown order is abandoned instead of retried forever", async () =>
  withPendingOrder(async ({ commerce, order }) => {
    await completeCheckout(commerce, order.id);
    await commerce.db.prepare("DELETE FROM order_items WHERE order_id = ?").run(order.id);
    await commerce.db.prepare("DELETE FROM orders WHERE id = ?").run(order.id);

    assert.deepEqual(await drain(commerce, order.id), { claimed: 1, delivered: 0, retryScheduled: 0, abandoned: 1 });
    const entry = await getOrderCommsEntry(commerce, order.id);
    assert.equal(entry.status, "abandoned");
    assert.equal(entry.lastError, "order_missing");
  }));

test("a recording-only transport does not mark the outbox delivered", async () =>
  withPendingOrder(async ({ commerce, order }) => {
    await completeCheckout(commerce, order.id);
    const summary = await processOrderCommsOutbox(commerce, {
      orderId: order.id,
      dispatchOptions: { env: {}, emailTransport: createRecordingEmailTransport() },
    });
    assert.deepEqual(summary, { claimed: 1, delivered: 0, retryScheduled: 1, abandoned: 0 });
    const entry = await getOrderCommsEntry(commerce, order.id);
    assert.equal(entry.status, "pending");
    assert.equal(entry.lastError, "recorded_not_sent");
  }));
