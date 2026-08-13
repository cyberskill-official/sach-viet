import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  createAuthStore,
  hashPhpassPassword,
  hashPassword,
  login,
  verifyPassword,
} from "../src/lib/auth-core.mjs";
import { createCommerceStore } from "../src/lib/commerce-core.mjs";
import {
  applyWordpressImportAsAdmin,
  getWordpressImportStatus,
  importWordpressFixture,
  listWordpressImportOutcomes,
} from "../src/lib/wordpress-import-core.mjs";

const sessionSecret = "a-session-secret-that-is-long-enough-for-the-test-suite";

async function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-wp-import-"));
  const dbPath = join(directory, "app.sqlite");
  const events = [];
  const authStore = await createAuthStore({
    dbPath,
    now: () => 1_700_000_000_000,
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  const commerceStore = await createCommerceStore({
    dbPath,
    clock: () => 1_700_000_000_000,
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  try {
    return await run({ authStore, commerceStore, events, dbPath });
  } finally {
    await authStore.close();
    await commerceStore.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

function sampleFixture(password = "imported-password-ok") {
  const passwordHash = hashPhpassPassword(password, { salt: "abcdefgh" });
  return {
    users: [
      {
        legacyWpUserId: "wp-user-1",
        email: "buyer@example.test",
        passwordHash,
        role: "customer",
      },
    ],
    orders: [
      {
        legacyWpOrderId: "wp-order-1",
        billingEmail: "buyer@example.test",
        totalUsd: "25.50",
        items: [
          {
            legacyWpOrderItemId: "wp-item-1",
            title: "Sách Việt",
            unitPriceUsd: "25.50",
            quantity: 1,
          },
        ],
      },
      {
        legacyWpOrderId: "wp-order-missing",
        billingEmail: "missing@example.test",
        totalUsd: "10.00",
        items: [{ title: "Ghost", unitPriceUsd: "10.00", quantity: 1 }],
      },
    ],
  };
}

test("PHPass hashes verify and scrypt path stays intact", async () => {
  const phpass = hashPhpassPassword("imported-password-ok", { salt: "abcdefgh" });
  assert.equal(verifyPassword("imported-password-ok", phpass), true);
  assert.equal(verifyPassword("wrong-password", phpass), false);
  const scrypt = hashPassword("correct horse battery staple");
  assert.equal(verifyPassword("correct horse battery staple", scrypt), true);
});

test("dry_run records outcomes without mutating users or orders", async () =>
  fixture(async ({ authStore, commerceStore }) => {
    const payload = sampleFixture();
    const result = await importWordpressFixture(authStore, commerceStore, payload, { mode: "dry_run" });
    assert.equal(result.acceptedCount, 2);
    assert.equal(result.unmatchedCount, 1);
    assert.equal((await authStore.db.prepare("SELECT COUNT(*) AS c FROM users").get()).c, 0);
    assert.equal((await commerceStore.db.prepare("SELECT COUNT(*) AS c FROM orders").get()).c, 0);
    const outcomes = await listWordpressImportOutcomes(authStore, result.runId);
    assert.ok(outcomes.some((row) => row.outcome === "unmatched"));
  }));

test("apply imports users/orders with legacy ids, PHPass login, and idempotent re-import", async () =>
  fixture(async ({ authStore, commerceStore }) => {
    const payload = sampleFixture();
    const first = await importWordpressFixture(authStore, commerceStore, payload, { mode: "apply" });
    assert.equal(first.acceptedCount, 2);
    assert.equal(first.unmatchedCount, 1);
    const user = await authStore.db.prepare("SELECT legacy_wp_user_id AS legacyId, password_hash AS hash FROM users WHERE email = ?").get("buyer@example.test");
    assert.equal(user.legacyId, "wp-user-1");
    assert.ok(user.hash.startsWith("$P$"));
    const loginResult = await login(authStore, {
      email: "buyer@example.test",
      password: "imported-password-ok",
      sessionSecret,
    });
    assert.equal(loginResult.ok, true);
    const order = await commerceStore.db
      .prepare("SELECT legacy_wp_order_id AS legacyId, status, subtotal_usd AS total FROM orders WHERE legacy_wp_order_id = ?")
      .get("wp-order-1");
    assert.equal(order.legacyId, "wp-order-1");
    assert.equal(order.status, "paid");
    assert.equal(order.total, "25.5000");
    const second = await importWordpressFixture(authStore, commerceStore, payload, { mode: "apply" });
    assert.equal(second.skippedCount, 2);
    assert.equal((await authStore.db.prepare("SELECT COUNT(*) AS c FROM users").get()).c, 1);
    assert.equal((await commerceStore.db.prepare("SELECT COUNT(*) AS c FROM orders").get()).c, 1);
  }));

test("admin status and apply gate non-admins", async () =>
  fixture(async ({ authStore, commerceStore }) => {
    await assert.rejects(async () => await getWordpressImportStatus(authStore, { role: "customer" }), /Admin access/);
    await assert.rejects(
      async () => await applyWordpressImportAsAdmin(authStore, commerceStore, { role: "vendor" }, sampleFixture()),
      /Admin access/,
    );
    const status = await getWordpressImportStatus(authStore, { role: "admin" });
    assert.equal(status.adapter, "fixture");
    assert.equal(status.mysqlClient, false);
    assert.equal(status.wordpressPhpRuntime, false);
    const result = await applyWordpressImportAsAdmin(authStore, commerceStore, { role: "admin" }, sampleFixture(), {
      mode: "dry_run",
    });
    assert.equal(result.mode, "dry_run");
  }));
