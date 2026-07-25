#!/usr/bin/env node
/**
 * Online-safe SQLite backup: opens the live DB, checkpoints WAL into the main
 * file, then copies the main database file to the destination.
 *
 * Usage (from app/web):
 *   DATABASE_PATH=/data/sachviet.sqlite node scripts/backup-sqlite.mjs [--out path]
 *
 * Default output: ./backups/sachviet-YYYYMMDD-HHMMSS.sqlite
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { openSqliteDatabase } from "../src/lib/sqlite.mjs";

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

export function backupSqliteDatabase({
  dbPath = process.env.DATABASE_PATH || "/data/sachviet.sqlite",
  outPath,
} = {}) {
  const source = resolve(dbPath);
  if (!existsSync(source)) throw new Error(`Database not found: ${source}`);

  const destination =
    outPath ||
    join(process.cwd(), "backups", `sachviet-${timestamp()}.sqlite`);
  mkdirSync(dirname(destination), { recursive: true });

  const db = openSqliteDatabase(source);
  try {
    db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
  } finally {
    db.close();
  }

  copyFileSync(source, destination);
  const bytes = statSync(destination).size;
  return { source, destination, bytes };
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  const outFlag = process.argv.indexOf("--out");
  const outPath = outFlag >= 0 ? process.argv[outFlag + 1] : undefined;
  try {
    const result = backupSqliteDatabase({ outPath });
    console.info(
      JSON.stringify({
        event: "sqlite_backup_completed",
        result: "accepted",
        source: result.source,
        destination: result.destination,
        bytes: result.bytes,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "sqlite_backup_failed",
        result: "failed",
        reason: error instanceof Error ? error.message : "backup_failed",
      }),
    );
    process.exitCode = 1;
  }
}
