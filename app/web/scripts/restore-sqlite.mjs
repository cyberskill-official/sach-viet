#!/usr/bin/env node
/**
 * @deprecated Transitional CapRover/SQLite artefact. Prefer `restore-postgres.mjs`
 * (`npm run restore:pg`) for local Docker / Postgres.
 *
 * Restore a SQLite backup file over DATABASE_PATH.
 *
 * Usage (from app/web) — stop the app first so writers are idle:
 *   DATABASE_PATH=/data/sachviet.sqlite node scripts/restore-sqlite.mjs --from ./backups/sachviet-….sqlite
 *
 * Creates a pre-restore safety copy next to the live DB when one already exists.
 * Recording a successful drill evidence file is an operator step (see OPERATIONS.md);
 * this script does not mark the `backup_verified` cutover gate.
 */
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { openSqliteDatabase } from "../src/lib/sqlite.mjs";

function removeSidecars(dbPath) {
  for (const suffix of ["-wal", "-shm"]) {
    const side = `${dbPath}${suffix}`;
    if (existsSync(side)) unlinkSync(side);
  }
}

export function restoreSqliteDatabase({
  dbPath = process.env.DATABASE_PATH || "/data/sachviet.sqlite",
  fromPath,
  skipVerify = false,
} = {}) {
  if (!fromPath) throw new Error("--from backup path is required.");
  const source = resolve(fromPath);
  const destination = resolve(dbPath);
  if (!existsSync(source)) throw new Error(`Backup not found: ${source}`);

  mkdirSync(dirname(destination), { recursive: true });

  let safetyCopy = null;
  if (existsSync(destination)) {
    safetyCopy = `${destination}.pre-restore-${Date.now()}`;
    copyFileSync(destination, safetyCopy);
  }

  removeSidecars(destination);
  copyFileSync(source, destination);
  removeSidecars(destination);

  if (!skipVerify) {
    const db = openSqliteDatabase(destination);
    try {
      const row = db.prepare("SELECT 1 AS ok").get();
      if (row?.ok !== 1) throw new Error("Restored database failed SELECT 1 probe.");
    } finally {
      db.close();
    }
  }

  return { source, destination, safetyCopy };
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  const fromFlag = process.argv.indexOf("--from");
  const fromPath = fromFlag >= 0 ? process.argv[fromFlag + 1] : undefined;
  try {
    const result = restoreSqliteDatabase({ fromPath });
    console.info(
      JSON.stringify({
        event: "sqlite_restore_completed",
        result: "accepted",
        source: result.source,
        destination: result.destination,
        safety_copy: result.safetyCopy,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "sqlite_restore_failed",
        result: "failed",
        reason: error instanceof Error ? error.message : "restore_failed",
      }),
    );
    process.exitCode = 1;
  }
}
