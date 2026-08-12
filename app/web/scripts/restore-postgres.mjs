#!/usr/bin/env node
/**
 * Restore a Postgres custom-format dump produced by backup-postgres.mjs / pg_dump -Fc.
 *
 * Usage (from app/web) — stop writers or accept brief inconsistency:
 *   DATABASE_URL=postgres://… node scripts/restore-postgres.mjs --from ./backups/sachviet-….dump
 *
 * Docker Compose equivalent (from app/):
 *   cat web/backups/sachviet-….dump | docker compose exec -T db pg_restore -U sachviet -d sachviet --clean --if-exists
 *
 * Recording a successful drill evidence file is an operator step (see OPERATIONS.md);
 * this script does not mark the `backup_verified` cutover gate.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function redactUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "postgres://***";
  }
}

/**
 * @param {{
 *   databaseUrl?: string,
 *   fromPath?: string,
 *   pgRestoreBin?: string,
 *   run?: typeof spawnSync,
 * }} [options]
 */
export function restorePostgresDatabase({
  databaseUrl = process.env.DATABASE_URL,
  fromPath,
  pgRestoreBin = process.env.PG_RESTORE_BIN || "pg_restore",
  run = spawnSync,
} = {}) {
  if (!databaseUrl || typeof databaseUrl !== "string" || databaseUrl.trim() === "") {
    throw new Error("DATABASE_URL is required for Postgres restore.");
  }
  if (!fromPath) throw new Error("--from backup path is required.");

  const source = resolve(fromPath);
  if (!existsSync(source)) throw new Error(`Backup not found: ${source}`);

  const args = [
    "--dbname",
    databaseUrl,
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-acl",
    "--exit-on-error",
    source,
  ];
  const result = run(pgRestoreBin, args, { encoding: "utf8" });
  if (result.error) {
    throw new Error(
      `Failed to run ${pgRestoreBin}: ${result.error.message}. Install PostgreSQL client tools or use docker compose exec db pg_restore.`,
    );
  }
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    throw new Error(stderr || `${pgRestoreBin} exited with status ${result.status}`);
  }

  return { databaseUrl: redactUrl(databaseUrl), source, args };
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  const fromFlag = process.argv.indexOf("--from");
  const fromPath = fromFlag >= 0 ? process.argv[fromFlag + 1] : undefined;
  try {
    const result = restorePostgresDatabase({ fromPath });
    console.info(
      JSON.stringify({
        event: "postgres_restore_completed",
        result: "accepted",
        database_url: result.databaseUrl,
        source: result.source,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "postgres_restore_failed",
        result: "failed",
        reason: error instanceof Error ? error.message : "restore_failed",
      }),
    );
    process.exitCode = 1;
  }
}
