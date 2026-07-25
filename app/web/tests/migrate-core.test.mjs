import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { MIGRATIONS } from "../migrations/registry.mjs";
import { applyPendingMigrationsSync, listAppliedMigrations } from "../src/lib/migrate.mjs";
import { openDatabase, tableExists } from "../src/lib/db.mjs";

test("openDatabase applies the migration registry once", () => {
  const dbPath = `/tmp/sachviet-migrate-test-${randomUUID()}`;
  const db = openDatabase(dbPath);
  try {
    const applied = listAppliedMigrations(db);
    assert.ok(applied.some((row) => row.id === "001_initial_schema"));
    assert.ok(applied.some((row) => row.id === "002_ai_settings"));
    assert.ok(tableExists(db, "user_channel_endpoints"));
    assert.ok(tableExists(db, "ai_settings"));
    const second = applyPendingMigrationsSync(db, MIGRATIONS);
    assert.deepEqual(second.applied, []);
  } finally {
    db.close();
  }
});
