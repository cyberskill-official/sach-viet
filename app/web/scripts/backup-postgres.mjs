#!/usr/bin/env node
/**
 * Postgres backup via pg_dump (custom format -Fc).
 *
 * Usage (from app/web), with tools on PATH:
 *   DATABASE_URL=postgres://… node scripts/backup-postgres.mjs [--out path]
 *
 * Docker Compose equivalent (from app/):
 *   docker compose exec -T db pg_dump -U sachviet -d sachviet -Fc > web/backups/sachviet-….dump
 *
 * Default output: ./backups/sachviet-YYYYMMDD-HHMMSS.dump
 * Recording a successful drill evidence file is an operator step (see OPERATIONS.md);
 * this script does not mark the `backup_verified` cutover gate.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

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
 *   outPath?: string,
 *   pgDumpBin?: string,
 *   run?: typeof spawnSync,
 * }} [options]
 */
export function backupPostgresDatabase({
  databaseUrl = process.env.DATABASE_URL,
  outPath,
  pgDumpBin = process.env.PG_DUMP_BIN || "pg_dump",
  run = spawnSync,
} = {}) {
  if (!databaseUrl || typeof databaseUrl !== "string" || databaseUrl.trim() === "") {
    throw new Error("DATABASE_URL is required for Postgres backup.");
  }

  const destination =
    outPath ||
    join(process.cwd(), "backups", `sachviet-${timestamp()}.dump`);
  mkdirSync(dirname(destination), { recursive: true });

  const args = ["--dbname", databaseUrl, "-Fc", "--no-owner", "--no-acl", "-f", destination];
  const result = run(pgDumpBin, args, { encoding: "utf8" });
  if (result.error) {
    throw new Error(
      `Failed to run ${pgDumpBin}: ${result.error.message}. Install PostgreSQL client tools or use docker compose exec db pg_dump.`,
    );
  }
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    throw new Error(stderr || `${pgDumpBin} exited with status ${result.status}`);
  }

  const bytes = statSync(destination).size;
  if (bytes <= 0) throw new Error("Backup file is empty.");
  return { databaseUrl: redactUrl(databaseUrl), destination, bytes, args };
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  const outFlag = process.argv.indexOf("--out");
  const outPath = outFlag >= 0 ? process.argv[outFlag + 1] : undefined;
  try {
    const result = backupPostgresDatabase({ outPath });
    console.info(
      JSON.stringify({
        event: "postgres_backup_completed",
        result: "accepted",
        database_url: result.databaseUrl,
        destination: result.destination,
        bytes: result.bytes,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "postgres_backup_failed",
        result: "failed",
        reason: error instanceof Error ? error.message : "backup_failed",
      }),
    );
    process.exitCode = 1;
  }
}
