import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { backupPostgresDatabase } from "../scripts/backup-postgres.mjs";
import { restorePostgresDatabase } from "../scripts/restore-postgres.mjs";
import { openDatabase } from "../src/lib/db.mjs";

test("backupPostgresDatabase requires DATABASE_URL and invokes pg_dump -Fc", async () => {
  assert.throws(() => backupPostgresDatabase({ databaseUrl: "" }), /DATABASE_URL/);

  const directory = mkdtempSync(join(tmpdir(), "sachviet-pg-backup-"));
  const outPath = join(directory, "probe.dump");
  try {
    let seen;
    const result = backupPostgresDatabase({
      databaseUrl: "postgres://sachviet:secret@127.0.0.1:54329/sachviet",
      outPath,
      pgDumpBin: "pg_dump",
      run: (bin, args) => {
        seen = { bin, args };
        writeFileSync(outPath, "PGDUMP");
        return { status: 0, stderr: "", error: null };
      },
    });
    assert.equal(seen.bin, "pg_dump");
    assert.deepEqual(seen.args, [
      "--dbname",
      "postgres://sachviet:secret@127.0.0.1:54329/sachviet",
      "-Fc",
      "--no-owner",
      "--no-acl",
      "-f",
      outPath,
    ]);
    assert.equal(result.destination, outPath);
    assert.equal(result.bytes, 6);
    assert.match(result.databaseUrl, /\*\*\*/);
    assert.equal(readFileSync(outPath, "utf8"), "PGDUMP");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("restorePostgresDatabase requires --from and invokes pg_restore --clean", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-pg-restore-"));
  const fromPath = join(directory, "probe.dump");
  writeFileSync(fromPath, "PGDUMP");
  try {
    assert.throws(
      () => restorePostgresDatabase({ databaseUrl: "postgres://sachviet@localhost/sachviet" }),
      /--from/,
    );
    let seen;
    const result = restorePostgresDatabase({
      databaseUrl: "postgres://sachviet:secret@127.0.0.1:54329/sachviet",
      fromPath,
      run: (bin, args) => {
        seen = { bin, args };
        return { status: 0, stderr: "", error: null };
      },
    });
    assert.equal(seen.bin, "pg_restore");
    assert.equal(seen.args[0], "--dbname");
    assert.ok(seen.args.includes("--clean"));
    assert.ok(seen.args.includes("--exit-on-error"));
    assert.equal(seen.args.at(-1), fromPath);
    assert.match(result.databaseUrl, /\*\*\*/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Postgres round-trip probe: insert and select survive a session", async () => {
  const dbPath = `/tmp/sachviet-backup-probe-${randomUUID()}`;
  const db = await openDatabase(dbPath);
  try {
    await db.exec("CREATE TABLE IF NOT EXISTS probe (id TEXT PRIMARY KEY, value TEXT NOT NULL)");
    await db.prepare("INSERT INTO probe (id, value) VALUES (?, ?)").run("p1", "hello");
    const row = await db.prepare("SELECT value FROM probe WHERE id = ?").get("p1");
    assert.equal(row.value, "hello");
  } finally {
    await db.close();
  }
});
