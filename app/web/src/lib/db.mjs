/**
 * Postgres data access for SachViet.
 *
 * Exposes a DatabaseSync-compatible sync surface (prepare/get/all/run/exec)
 * backed by `pg` via a synckit worker, so existing store factories stay sync.
 */
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSyncFn } from "synckit";
import { MIGRATIONS } from "../../migrations/registry.mjs";
import { applyPendingMigrationsSync } from "./migrate.mjs";

/**
 * Resolve the synckit worker without `new URL(..., import.meta.url)`.
 * Turbopack rewrites that pattern into a media asset URL and breaks
 * `createSyncFn` / `pathToFileURL` during `next build` page collection.
 * Prefer cwd-relative paths (Docker + local). On Vercel file tracing, also try
 * the module directory via `fileURLToPath(import.meta.url)` (not `new URL`).
 */
function resolveDbWorkerPath() {
  const besideModule = join(dirname(fileURLToPath(import.meta.url)), "db-worker.mjs");
  const candidates = [
    join(process.cwd(), "src/lib/db-worker.mjs"),
    join(process.cwd(), "db-worker.mjs"),
    besideModule,
    join(process.cwd(), ".next/server/src/lib/db-worker.mjs"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    `db-worker.mjs not found (cwd=${process.cwd()}; tried ${candidates.join(", ")})`,
  );
}

/** Lazy init — top-level createSyncFn can hang cold-start on some serverless hosts. */
let callWorker;

function getCallWorker() {
  if (!callWorker) {
    callWorker = createSyncFn(resolveDbWorkerPath());
  }
  return callWorker;
}

function resolveDbRpcPath() {
  const besideModule = join(dirname(fileURLToPath(import.meta.url)), "db-rpc-oneshot.mjs");
  const candidates = [
    join(process.cwd(), "src/lib/db-rpc-oneshot.mjs"),
    join(process.cwd(), "db-rpc-oneshot.mjs"),
    besideModule,
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    `db-rpc-oneshot.mjs not found (cwd=${process.cwd()}; tried ${candidates.join(", ")})`,
  );
}

/**
 * Vercel serverless: worker_threads / synckit hang. Use one-shot spawnSync RPC instead.
 * @param {object} message
 */
function callViaSpawnSync(message) {
  const rpc = resolveDbRpcPath();
  const result = spawnSync(process.execPath, [rpc], {
    input: JSON.stringify(message),
    encoding: "utf8",
    timeout: 20_000,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  const stdout = (result.stdout || "").trim();
  let parsed;
  try {
    parsed = stdout ? JSON.parse(stdout) : null;
  } catch {
    throw new Error(
      `db-rpc invalid JSON (status=${result.status}): ${(result.stderr || stdout).slice(0, 400)}`,
    );
  }
  if (parsed?.__error) throw new Error(parsed.__error);
  if (result.status !== 0) {
    throw new Error((result.stderr || stdout || `db-rpc exited ${result.status}`).slice(0, 400));
  }
  return parsed?.__result;
}

/** Default local Compose Postgres (see app/docker-compose.yml). */
export const DEFAULT_DATABASE_URL = "postgres://sachviet:sachviet@127.0.0.1:54329/sachviet";

/** Retained for transitional imports from older SQLite busy-timeout helpers. */
export const DEFAULT_BUSY_TIMEOUT_MS = 5000;

/**
 * @param {string | undefined} databaseUrl
 * @returns {string}
 */
export function resolveDatabaseUrl(databaseUrl) {
  return databaseUrl || process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
}

/**
 * Stable schema name for tests that still pass a filesystem-style `dbPath`.
 * Production / Docker leave schema unset (public).
 */
export function schemaFromDbPath(dbPath) {
  if (!dbPath || typeof dbPath !== "string") return null;
  const digest = createHash("sha256").update(dbPath).digest("hex").slice(0, 16);
  return `t_${digest}`;
}

function newSessionId() {
  return randomBytes(12).toString("hex");
}

function call(message) {
  try {
    if (process.env.VERCEL) return callViaSpawnSync(message);
    return getCallWorker()(message);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(typeof error === "string" ? error : "Database worker failed.");
  }
}

export function isSerializationConflictError(error) {
  return (
    error instanceof Error &&
    (error.message.includes("could not serialize") ||
      error.message.includes("deadlock detected") ||
      error.message.includes("40001") ||
      error.message.includes("40P01"))
  );
}

/** @deprecated Prefer isSerializationConflictError. */
export function isSqliteBusyError(error) {
  return isSerializationConflictError(error);
}

/** True for SQLite or Postgres unique-constraint violations. */
export function isUniqueViolationError(error) {
  return (
    error instanceof Error &&
    (error.message.includes("UNIQUE constraint failed") ||
      error.message.includes("duplicate key value violates unique constraint") ||
      error.message.includes("23505"))
  );
}

/**
 * Sync Postgres handle with a node:sqlite-like API.
 */
export class PgDatabase {
  /**
   * @param {string} id
   * @param {string} [databaseUrl]
   * @param {string | null} [schema]
   */
  constructor(id, databaseUrl = "", schema = null) {
    this.id = id;
    this.databaseUrl = databaseUrl;
    this.schema = schema;
  }

  /**
   * @param {string} sql
   */
  exec(sql) {
    call({
      op: "exec",
      id: this.id,
      databaseUrl: this.databaseUrl,
      schema: this.schema,
      sql,
    });
  }

  /**
   * @param {string} sql
   */
  prepare(sql) {
    const id = this.id;
    const databaseUrl = this.databaseUrl;
    const schema = this.schema;
    return {
      get(...params) {
        return call({ op: "query", id, databaseUrl, schema, sql, params, mode: "get" });
      },
      all(...params) {
        return call({ op: "query", id, databaseUrl, schema, sql, params, mode: "all" });
      },
      run(...params) {
        return call({ op: "query", id, databaseUrl, schema, sql, params, mode: "run" });
      },
    };
  }

  close() {
    call({ op: "close", id: this.id, databaseUrl: this.databaseUrl, schema: this.schema });
  }
}

/**
 * Opens a Postgres session. Prefer `DATABASE_URL`. Optional `dbPath` selects a
 * disposable schema (test compatibility with former SQLite temp files).
 *
 * @param {string | undefined} databaseUrlOrDbPath When it looks like a path
 *   (contains `/` or ends with `.sqlite`) it is treated as a legacy dbPath.
 * @param {{ databaseUrl?: string, schema?: string | null, skipMigrations?: boolean, dbPath?: string }} [options]
 * @returns {PgDatabase}
 */
export function openDatabase(databaseUrlOrDbPath, options = {}) {
  const {
    databaseUrl: explicitUrl,
    schema: explicitSchema,
    skipMigrations = false,
    dbPath: explicitDbPath,
  } = options;

  let legacyPath;
  let url = explicitUrl;
  if (typeof databaseUrlOrDbPath === "string") {
    if (databaseUrlOrDbPath.includes("://") || databaseUrlOrDbPath.startsWith("postgres")) {
      url = databaseUrlOrDbPath;
    } else {
      legacyPath = databaseUrlOrDbPath;
    }
  }

  const dbPath = explicitDbPath || legacyPath;
  const schema =
    explicitSchema === undefined ? (dbPath ? schemaFromDbPath(dbPath) : null) : explicitSchema;
  const databaseUrl = resolveDatabaseUrl(url);
  const id = newSessionId();

  call({ op: "open", id, databaseUrl, schema });
  const db = new PgDatabase(id, databaseUrl, schema);
  if (!skipMigrations) applyPendingMigrationsSync(db, MIGRATIONS);
  return db;
}

/** @deprecated Use openDatabase. Kept so transitional imports keep working. */
export function openSqliteDatabase(dbPath, options = {}) {
  return openDatabase(dbPath, options);
}

/** Starts a write transaction, retrying on serialization/deadlock conflicts. */
export function beginImmediateWithRetry(db, { retries = 3, backoffMs = 50 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      call({
        op: "begin",
        id: db.id,
        databaseUrl: db.databaseUrl,
        schema: db.schema,
        retries: 0,
        backoffMs,
      });
      return;
    } catch (error) {
      if (!isSerializationConflictError(error) || attempt >= retries) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, backoffMs * (attempt + 1));
    }
  }
}

/** True when a table is visible on the session search_path. */
export function tableExists(db, name) {
  const row = db
    .prepare(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = ANY (current_schemas(false))
           AND table_name = ?
       ) AS ok`,
    )
    .get(name);
  return Boolean(row?.ok);
}

/** Column names for a table on the session search_path (PRAGMA table_info replacement). */
export function listTableColumns(db, tableName) {
  return db
    .prepare(
      `SELECT column_name AS name
       FROM information_schema.columns
       WHERE table_schema = ANY (current_schemas(false))
         AND table_name = ?
       ORDER BY ordinal_position`,
    )
    .all(tableName);
}
