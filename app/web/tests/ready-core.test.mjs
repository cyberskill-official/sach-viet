import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { MIGRATIONS } from "../migrations/registry.mjs";
import { openDatabase } from "../src/lib/db.mjs";
import { getReadiness, REQUIRED_READY_ENV } from "../src/lib/ready-core.mjs";

test("getReadiness reports db, latest migration, outbox age, and env presence without secrets", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-ready-"));
  const db = await openDatabase(join(directory, "ready.sqlite"));
  try {
    await db
      .prepare(
        `INSERT INTO order_comms_outbox
          (id, order_id, kind, status, attempts, available_at, last_error, created_at, updated_at)
         VALUES (?, ?, 'order.paid', 'pending', 0, ?, NULL, ?, ?)`,
      )
      .run("outbox-1", "order-1", 1_000, 1_000, 1_000);

    const missing = await getReadiness({
      db,
      env: { DATABASE_URL: "postgres://example", AUTH_SESSION_SECRET: "x".repeat(32) },
      now: () => 2_000,
    });
    assert.equal(missing.ok, false);
    assert.equal(missing.db, "ok");
    assert.equal(missing.migration.latest, MIGRATIONS[MIGRATIONS.length - 1].id);
    assert.equal(missing.outbox.oldestPendingAgeMs, 1_000);
    assert.equal(missing.env.CRON_SECRET, false);
    assert.equal(JSON.stringify(missing).includes("postgres://example"), false);
    assert.equal(JSON.stringify(missing).includes("x".repeat(32)), false);

    const ready = await getReadiness({
      db,
      env: {
        DATABASE_URL: "postgres://example",
        AUTH_SESSION_SECRET: "x".repeat(32),
        CRON_SECRET: "cron",
        VERCEL_GIT_COMMIT_SHA: "deadbeef",
        VERCEL_ENV: "preview",
      },
      now: () => 2_000,
    });
    assert.equal(ready.ok, true);
    assert.deepEqual(REQUIRED_READY_ENV, ["DATABASE_URL", "AUTH_SESSION_SECRET", "CRON_SECRET"]);
    assert.equal(ready.release.sha, "deadbeef");
    assert.equal(ready.release.deploymentEnv, "preview");
    assert.equal(ready.schema.name, "public");
    assert.equal(ready.storage.mode, "postgres_bytea");
    assert.deepEqual(ready.identity, { userCount: 0, adminCount: 0, bootstrapEligible: true });
    assert.equal(JSON.stringify(ready).includes("x".repeat(32)), false);
  } finally {
    await db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("getReadiness fails closed when DATABASE_URL is absent and no db is injected", async () => {
  const snapshot = await getReadiness({
    env: { AUTH_SESSION_SECRET: "x".repeat(32), CRON_SECRET: "cron" },
  });
  assert.equal(snapshot.ok, false);
  assert.equal(snapshot.db, "error");
  assert.equal(snapshot.env.DATABASE_URL, false);
});
