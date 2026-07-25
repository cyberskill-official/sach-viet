import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { MIGRATIONS } from "../migrations/registry.mjs";
import { applyPendingMigrationsSync, listAppliedMigrations } from "../src/lib/migrate.mjs";
import { openSqliteDatabase } from "../src/lib/sqlite.mjs";

test("openSqliteDatabase applies the migration registry once", () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-migrate-"));
  const dbPath = join(directory, "app.sqlite");
  try {
    const db = openSqliteDatabase(dbPath);
    const applied = listAppliedMigrations(db);
    assert.ok(applied.some((row) => row.id === "001_user_channel_endpoints"));
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user_channel_endpoints'")
      .get();
    assert.equal(table.name, "user_channel_endpoints");
    const second = applyPendingMigrationsSync(db, MIGRATIONS);
    assert.deepEqual(second.applied, []);
    db.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
