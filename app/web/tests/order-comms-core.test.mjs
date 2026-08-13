import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogStore, createCategory, createProduct, writeVendorOffer } from "../src/lib/catalog-core.mjs";
import { createCommerceStore, createPendingOrder } from "../src/lib/commerce-core.mjs";
import {
  createRecordingEmailTransport,
  createSmtpEmailTransport,
} from "../src/lib/email-zalo-integrations-core.mjs";
import { dispatchOrderPaidConfirmation } from "../src/lib/order-comms-core.mjs";

async function withPaidOrder(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-order-comms-"));
  const dbPath = join(directory, "sachviet.sqlite");
  const events = [];
  const catalog = await createCatalogStore({ dbPath, log: () => {} });
  const commerce = await createCommerceStore({
    dbPath,
    log: (event, fields = {}) => events.push({ event, ...fields }),
    clock: () => 2000,
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
    await commerce.db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order.id);
    return await run({ commerce, order, events, user });
  } finally {
    await commerce.close();
    await catalog.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("order confirmation records when SMTP is unset (recording stub is not delivery)", async () =>
  withPaidOrder(async ({ commerce, order, events }) => {
    const transport = createRecordingEmailTransport({ log: commerce.log });
    const result = await dispatchOrderPaidConfirmation(commerce, order.id, {
      env: {},
      emailTransport: transport,
    });
    assert.equal(result.emailed, false);
    assert.equal(result.outcome, "recorded");
    assert.equal(result.transportMode, "recording");
    assert.equal(result.notified, true);
    assert.ok(events.some((row) => row.event === "order_confirmation_email_dispatched" && row.result === "recorded"));
    const attempt = await commerce.db
      .prepare("SELECT outcome FROM notification_delivery_attempts WHERE channel = 'email' AND outcome = 'recorded' LIMIT 1")
      .get();
    assert.equal(attempt.outcome, "recorded");
  }));

test("order confirmation sends when SMTP transport submitter is configured", async () =>
  withPaidOrder(async ({ commerce, order }) => {
    const transport = createSmtpEmailTransport({
      host: "smtp.example.test",
      from: "orders@example.test",
      submit: () => ({ outcome: "sent", providerMessageId: "msg_1" }),
      log: commerce.log,
    });
    const result = await dispatchOrderPaidConfirmation(commerce, order.id, {
      env: { SMTP_HOST: "smtp.example.test", SMTP_FROM: "orders@example.test" },
      emailTransport: transport,
    });
    assert.equal(result.emailed, true);
    assert.equal(result.outcome, "sent");
    assert.equal(result.transportMode, "smtp");
    const attempt = await commerce.db
      .prepare("SELECT outcome FROM notification_delivery_attempts WHERE channel = 'email' AND outcome = 'sent' LIMIT 1")
      .get();
    assert.equal(attempt.outcome, "sent");
  }));

test("order confirmation skips email when recipient is missing", async () =>
  withPaidOrder(async ({ commerce, order }) => {
    const result = await dispatchOrderPaidConfirmation(commerce, order.id, {
      emailTransport: createRecordingEmailTransport(),
      resolveEmail: () => null,
    });
    assert.equal(result.emailed, false);
    assert.equal(result.reason, "missing_recipient");
  }));
