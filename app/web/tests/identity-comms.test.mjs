import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  createAuthStore,
  registerCustomer,
  requestPasswordReset,
} from "../src/lib/auth-core.mjs";
import { createSmtpEmailTransport, createRecordingEmailTransport } from "../src/lib/email-zalo-integrations-core.mjs";
import { processOrderCommsOutbox } from "../src/lib/order-comms-core.mjs";
import { getOrderCommsEntry } from "../src/lib/order-comms-outbox-core.mjs";

async function withAuthStore(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-identity-comms-"));
  const store = await createAuthStore({ dbPath: join(directory, "auth.sqlite"), log: () => {} });
  try {
    return await run(store);
  } finally {
    await store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("register and reset enqueue identity mail; injected submit delivers", async () => {
  await withAuthStore(async (store) => {
    const registered = await registerCustomer(store, { email: "new@example.test", password: "correct horse" });
    const queued = await getOrderCommsEntry(store, registered.user.id, { kind: "identity.verify" });
    assert.equal(queued.status, "pending");
    assert.equal(queued.payload.email, "new@example.test");
    assert.equal(queued.payload.token, registered.verifyToken);

    const submitted = [];
    const summary = await processOrderCommsOutbox(store, {
      orderId: registered.user.id,
      dispatchOptions: {
        env: { SMTP_HOST: "smtp.example.test", SMTP_FROM: "noreply@example.test" },
        emailTransport: createSmtpEmailTransport({
          host: "smtp.example.test",
          from: "noreply@example.test",
          submit: (message) => {
            submitted.push(message);
            return { outcome: "sent", providerMessageId: "msg_verify" };
          },
        }),
      },
    });
    assert.deepEqual(summary, { claimed: 1, delivered: 1, retryScheduled: 0, abandoned: 0 });
    assert.equal((await getOrderCommsEntry(store, registered.user.id, { kind: "identity.verify" })).status, "delivered");
    assert.equal(submitted.length, 1);
    assert.match(submitted[0].text, /verify/);

    const reset = await requestPasswordReset(store, "new@example.test");
    const resetQueued = await getOrderCommsEntry(store, registered.user.id, { kind: "identity.reset" });
    assert.equal(resetQueued.status, "pending");
    assert.equal(resetQueued.payload.token, reset.resetToken);

    const resetSummary = await processOrderCommsOutbox(store, {
      orderId: registered.user.id,
      dispatchOptions: {
        env: { SMTP_HOST: "smtp.example.test", SMTP_FROM: "noreply@example.test" },
        submit: () => ({ outcome: "sent", providerMessageId: "msg_reset" }),
      },
    });
    assert.equal(resetSummary.delivered, 1);
    assert.equal((await getOrderCommsEntry(store, registered.user.id, { kind: "identity.reset" })).status, "delivered");
  });
});

test("production without SMTP leaves identity mail failed, not delivered", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    await withAuthStore(async (store) => {
      const registered = await registerCustomer(store, { email: "prod@example.test", password: "correct horse" });
      const summary = await processOrderCommsOutbox(store, {
        orderId: registered.user.id,
        dispatchOptions: {
          env: {},
          emailTransport: createRecordingEmailTransport({ log: store.log }),
        },
      });
      assert.equal(summary.delivered, 0);
      assert.equal(summary.retryScheduled, 1);
      const entry = await getOrderCommsEntry(store, registered.user.id, { kind: "identity.verify" });
      assert.equal(entry.status, "pending");
      assert.notEqual(entry.status, "delivered");
      assert.equal(entry.lastError, "recorded_not_sent");
    });
  } finally {
    process.env.NODE_ENV = previous;
  }
});
