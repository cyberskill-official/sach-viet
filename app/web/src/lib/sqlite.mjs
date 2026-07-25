import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS } from "../../migrations/registry.mjs";
import { applyPendingMigrationsSync } from "./migrate.mjs";

export const DEFAULT_BUSY_TIMEOUT_MS = 5000;

/**
 * Opens a SQLite database with the settings every store factory must share:
 * WAL journaling and a busy timeout, so concurrent writers wait for the lock
 * instead of failing immediately with SQLITE_BUSY (busy_timeout defaults to 0).
 * Also applies any pending versioned migrations from `migrations/registry.mjs`.
 *
 * @param {string | undefined} dbPath Explicit path; falls back to DATABASE_PATH, then /data/sachviet.sqlite.
 * @returns {DatabaseSync}
 */
export function openSqliteDatabase(dbPath, { busyTimeoutMs = DEFAULT_BUSY_TIMEOUT_MS, skipMigrations = false } = {}) {
  const path = dbPath || process.env.DATABASE_PATH || "/data/sachviet.sqlite";
  if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA busy_timeout = ${Number(busyTimeoutMs)};
    PRAGMA journal_mode = WAL;
  `);
  if (!skipMigrations) applyPendingMigrationsSync(db, MIGRATIONS);
  return db;
}

export function isSqliteBusyError(error) {
  return error instanceof Error && (error.message.includes("database is locked") || error.errcode === 5 /* SQLITE_BUSY */);
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Starts an immediate (write) transaction, retrying with a short backoff when
 * the database is locked past the connection's busy timeout.
 */
export function beginImmediateWithRetry(db, { retries = 3, backoffMs = 50 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      db.exec("BEGIN IMMEDIATE");
      return;
    } catch (error) {
      if (!isSqliteBusyError(error) || attempt >= retries) throw error;
      sleepSync(backoffMs * (attempt + 1));
    }
  }
}
