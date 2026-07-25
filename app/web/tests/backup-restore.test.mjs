import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { backupSqliteDatabase } from "../scripts/backup-sqlite.mjs";
import { restoreSqliteDatabase } from "../scripts/restore-sqlite.mjs";
import { openSqliteDatabase } from "../src/lib/sqlite.mjs";

test("backup and restore round-trip preserves table data", () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-backup-"));
  const dbPath = join(directory, "live.sqlite");
  const backupPath = join(directory, "copy.sqlite");
  const restoredPath = join(directory, "restored.sqlite");
  try {
    const db = openSqliteDatabase(dbPath);
    db.exec("CREATE TABLE IF NOT EXISTS probe (id TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;");
    db.prepare("INSERT INTO probe (id, value) VALUES (?, ?)").run("a", "hello");
    db.close();

    const backup = backupSqliteDatabase({ dbPath, outPath: backupPath });
    assert.equal(backup.destination, backupPath);
    assert.ok(backup.bytes > 0);

    const restored = restoreSqliteDatabase({ dbPath: restoredPath, fromPath: backupPath });
    assert.equal(restored.destination, restoredPath);

    const check = openSqliteDatabase(restoredPath);
    assert.equal(check.prepare("SELECT value FROM probe WHERE id = ?").get("a").value, "hello");
    check.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
