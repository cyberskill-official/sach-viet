import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";

import { DEFAULT_BUSY_TIMEOUT_MS, openSqliteDatabase } from "../src/lib/sqlite.mjs";
import { createAdminCommerceStore } from "../src/lib/admin-commerce-core.mjs";
import { createAuthStore } from "../src/lib/auth-core.mjs";
import { createAuthorPortalStore } from "../src/lib/author-portal-core.mjs";
import { createB2bOrderStore } from "../src/lib/b2b-order-core.mjs";
import { createB2bQuoteStore } from "../src/lib/b2b-quote-core.mjs";
import { createCatalogStore } from "../src/lib/catalog-core.mjs";
import { createCommerceStore } from "../src/lib/commerce-core.mjs";
import { createEmployeeRetailStore } from "../src/lib/employee-retail-core.mjs";
import { createInstitutionBuyerStore } from "../src/lib/institution-buyer-core.mjs";
import { createNotificationStore } from "../src/lib/notification-core.mjs";
import { createPublisherPortalStore } from "../src/lib/publisher-portal-core.mjs";
import { createSupportStore } from "../src/lib/support-core.mjs";
import { createVendorCommerceStore } from "../src/lib/vendor-commerce-core.mjs";

const WORKER_PATH = fileURLToPath(new URL("./helpers/sqlite-writer-worker.mjs", import.meta.url));

const STORE_FACTORIES = {
  createAdminCommerceStore,
  createAuthStore,
  createAuthorPortalStore,
  createB2bOrderStore,
  createB2bQuoteStore,
  createCatalogStore,
  createCommerceStore,
  createEmployeeRetailStore,
  createInstitutionBuyerStore,
  createNotificationStore,
  createPublisherPortalStore,
  createSupportStore,
  createVendorCommerceStore,
};

function withTempDir(run) {
  const dir = mkdtempSync(join(tmpdir(), "sachviet-sqlite-test-"));
  try {
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("every store factory opens SQLite with busy_timeout and WAL", () => {
  withTempDir((dir) => {
    for (const [name, factory] of Object.entries(STORE_FACTORIES)) {
      const store = factory({ dbPath: join(dir, `${name}.sqlite`), log: () => {} });
      const busyTimeout = store.db.prepare("PRAGMA busy_timeout").get();
      assert.equal(busyTimeout.timeout, DEFAULT_BUSY_TIMEOUT_MS, `${name} must set busy_timeout`);
      const journalMode = store.db.prepare("PRAGMA journal_mode").get();
      assert.equal(journalMode.journal_mode, "wal", `${name} must use WAL journaling`);
      store.close();
    }
  });
});

test("two concurrent writers complete without SQLITE_BUSY failures", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sachviet-sqlite-test-"));
  const dbPath = join(dir, "concurrent.sqlite");
  const iterations = 100;

  const setup = openSqliteDatabase(dbPath);
  setup.exec("CREATE TABLE IF NOT EXISTS concurrency_probe (id TEXT PRIMARY KEY, writer TEXT NOT NULL, iteration INTEGER NOT NULL) STRICT");
  setup.close();

  const runWriter = (writerId) =>
    new Promise((resolve, reject) => {
      const worker = new Worker(WORKER_PATH, { workerData: { dbPath, writerId, iterations } });
      worker.on("message", resolve);
      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0) reject(new Error(`Writer ${writerId} exited with code ${code}`));
      });
    });

  try {
    const results = await Promise.all([runWriter("writer-a"), runWriter("writer-b")]);
    assert.deepEqual(
      results.map((result) => result.completed),
      [iterations, iterations],
    );

    const verify = openSqliteDatabase(dbPath);
    const { total } = verify.prepare("SELECT COUNT(*) AS total FROM concurrency_probe").get();
    verify.close();
    assert.equal(total, iterations * 2, "all writes from both writers must be committed");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
