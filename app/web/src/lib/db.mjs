/**
 * Postgres data access for SachViet.
 *
 * In-process async `pg` Pool for local, CI, Docker, and Vercel. Transactions use a
 * checked-out client so BEGIN/COMMIT/ROLLBACK are real (not spawnSync no-ops).
 */
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";
import { MIGRATIONS } from "../../migrations/registry.mjs";
import { applyPendingMigrations } from "./migrate.mjs";

const { Pool, types } = pg;

// BIGINT / COUNT(*) come back as strings by default; app code expects numbers.
types.setTypeParser(types.builtins.INT8, (value) => Number(value));

/** @type {Map<string, import("pg").Pool>} */
const sharedPools = new Map();

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

function quoteIdent(ident) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) {
    throw new Error(`Invalid SQL identifier: ${ident}`);
  }
  return `"${ident}"`;
}

export function isLocalDatabaseHost(databaseUrl) {
  try {
    const { hostname } = new URL(databaseUrl);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "db" ||
      hostname === "::1"
    );
  } catch {
    return false;
  }
}

/**
 * TLS policy: loopback/Compose have no TLS. Remote hosts verify certificates
 * unless `PGSSL_REJECT_UNAUTHORIZED=0` (documented override for poolers whose
 * chain the runtime trust store rejects).
 * @param {string} databaseUrl
 */
export function sslOptionsForDatabaseUrl(databaseUrl) {
  if (isLocalDatabaseHost(databaseUrl)) return undefined;
  const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== "0";
  return { rejectUnauthorized };
}

function poolOptions(databaseUrl) {
  const onVercel = Boolean(process.env.VERCEL);
  const ssl = sslOptionsForDatabaseUrl(databaseUrl);
  return {
    connectionString: databaseUrl,
    max: onVercel ? 1 : 40,
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: onVercel ? 5_000 : 30_000,
    ...(ssl ? { ssl } : {}),
  };
}

export function getSharedPool(databaseUrl) {
  const url = resolveDatabaseUrl(databaseUrl);
  let pool = sharedPools.get(url);
  if (!pool) {
    pool = new Pool(poolOptions(url));
    sharedPools.set(url, pool);
  }
  return pool;
}

function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

/**
 * Postgres folds unquoted identifiers to lowercase. Quote camelCase AS aliases
 * so row keys match the SQLite-era JavaScript property names.
 */
function quoteCamelCaseAliases(sql) {
  return sql.replace(/\bAS\s+"?([A-Za-z_][A-Za-z0-9_]*)"?/gi, (match, alias) => {
    if (alias !== alias.toLowerCase() && alias !== alias.toUpperCase()) {
      return `AS "${alias}"`;
    }
    return match;
  });
}

export function prepareSql(sql) {
  return convertPlaceholders(quoteCamelCaseAliases(sql));
}

function splitStatements(sql) {
  return sql
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function isBegin(sql) {
  return /^(BEGIN)(\s+IMMEDIATE)?$/i.test(sql.trim());
}

function isCommit(sql) {
  return /^COMMIT$/i.test(sql.trim());
}

function isRollback(sql) {
  return /^ROLLBACK$/i.test(sql.trim());
}

function isSerializationError(error) {
  return error && (error.code === "40001" || error.code === "40P01");
}

export function isSerializationConflictError(error) {
  return (
    error instanceof Error &&
    (error.message.includes("could not serialize") ||
      error.message.includes("deadlock detected") ||
      error.message.includes("40001") ||
      error.message.includes("40P01") ||
      isSerializationError(error))
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
      error.message.includes("23505") ||
      error.code === "23505")
  );
}

function wrapError(error) {
  if (error instanceof Error) {
    if (error.code && !error.message.includes(String(error.code))) {
      error.message = `${error.message} (${error.code})`;
    }
    return error;
  }
  return new Error(typeof error === "string" ? error : "Database query failed.");
}

/**
 * Async Postgres handle with a node:sqlite-like API (prepare/get/all/run/exec).
 * Callers must await get/all/run/exec/close.
 */
export class PgDatabase {
  /**
   * @param {{ pool: import("pg").Pool, databaseUrl: string, schema?: string | null, id?: string }} options
   */
  constructor({ pool, databaseUrl, schema = null, id = newSessionId() }) {
    this.id = id;
    this.pool = pool;
    this.databaseUrl = databaseUrl;
    this.schema = schema;
    /** @type {import("pg").PoolClient | null} */
    this.client = null;
    this.closed = false;
    /** @type {number | null} */
    this._writesRemainingBeforeFailure = null;
  }

  /**
   * Test hook: allow `count` successful write queries, then throw on the next write.
   * Used to prove ROLLBACK leaves zero partial commits.
   * @param {number} count
   */
  injectFailureAfterWrites(count) {
    this._writesRemainingBeforeFailure = count;
  }

  clearFailureInjection() {
    this._writesRemainingBeforeFailure = null;
  }

  async _ensureSearchPath(executor) {
    if (!this.schema) return;
    await executor.query(`SET search_path TO ${quoteIdent(this.schema)}, public`);
  }

  async _executor() {
    if (this.closed) throw new Error("Database session is closed.");
    if (this.client) return this.client;
    return this.pool;
  }

  _maybeInjectWriteFailure(sql) {
    if (this._writesRemainingBeforeFailure == null) return;
    const trimmed = sql.trim();
    if (isBegin(trimmed) || isCommit(trimmed) || isRollback(trimmed)) return;
    const isWrite = /^(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE)\b/i.test(trimmed);
    if (!isWrite) return;
    if (this._writesRemainingBeforeFailure <= 0) {
      throw new Error("injected adapter failure");
    }
    this._writesRemainingBeforeFailure -= 1;
  }

  /**
   * @param {string} sql
   * @param {unknown[]} [params]
   * @param {"get" | "all" | "run"} [mode]
   * @returns {Promise<any>}
   */
  async query(sql, params = [], mode = "all") {
    this._maybeInjectWriteFailure(sql);
    const text = prepareSql(sql);
    try {
      if (this.client) {
        await this._ensureSearchPath(this.client);
        const result = await this.client.query(text, params);
        if (mode === "get") return result.rows[0];
        if (mode === "all") return result.rows;
        return { changes: result.rowCount ?? 0 };
      }
      if (this.schema) {
        const borrowed = await this.pool.connect();
        try {
          await this._ensureSearchPath(borrowed);
          const result = await borrowed.query(text, params);
          if (mode === "get") return result.rows[0];
          if (mode === "all") return result.rows;
          return { changes: result.rowCount ?? 0 };
        } finally {
          borrowed.release();
        }
      }
      const result = await this.pool.query(text, params);
      if (mode === "get") return result.rows[0];
      if (mode === "all") return result.rows;
      return { changes: result.rowCount ?? 0 };
    } catch (error) {
      throw wrapError(error);
    }
  }

  async begin() {
    if (this.closed) throw new Error("Database session is closed.");
    if (!this.client) {
      this.client = await this.pool.connect();
      try {
        await this._ensureSearchPath(this.client);
      } catch (error) {
        this.client.release();
        this.client = null;
        throw wrapError(error);
      }
    } else {
      await this._ensureSearchPath(this.client);
    }
    await this.client.query("BEGIN");
  }

  async commit() {
    if (!this.client) throw new Error("COMMIT without an open transaction.");
    await this.client.query("COMMIT");
    if (!this.schema) {
      this.client.release();
      this.client = null;
    }
  }

  async rollback() {
    if (!this.client) throw new Error("ROLLBACK without an open transaction.");
    await this.client.query("ROLLBACK");
    if (!this.schema) {
      this.client.release();
      this.client = null;
    }
  }

  /**
   * @param {string} sql
   */
  async exec(sql) {
    const statements = splitStatements(sql);
    for (const statement of statements) {
      if (isBegin(statement)) {
        await this.begin();
        continue;
      }
      if (isCommit(statement)) {
        await this.commit();
        continue;
      }
      if (isRollback(statement)) {
        await this.rollback();
        continue;
      }
      this._maybeInjectWriteFailure(statement);
      try {
        if (this.client) {
          await this._ensureSearchPath(this.client);
          await this.client.query(statement);
        } else if (this.schema) {
          const borrowed = await this.pool.connect();
          try {
            await this._ensureSearchPath(borrowed);
            await borrowed.query(statement);
          } finally {
            borrowed.release();
          }
        } else {
          await this.pool.query(statement);
        }
      } catch (error) {
        throw wrapError(error);
      }
    }
  }

  /**
   * @param {string} sql
   * @returns {{
   *   get: (...params: unknown[]) => Promise<any>,
   *   all: (...params: unknown[]) => Promise<any[]>,
   *   run: (...params: unknown[]) => Promise<{ changes: number }>,
   * }}
   */
  prepare(sql) {
    return {
      get: (...params) => this.query(sql, params, "get"),
      all: (...params) => this.query(sql, params, "all"),
      run: (...params) => this.query(sql, params, "run"),
    };
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    if (this.client) {
      try {
        await this.client.query("ROLLBACK");
      } catch {
        // ignore — no open transaction
      }
      this.client.release();
      this.client = null;
    }
  }
}

/**
 * Opens a Postgres session. Prefer `DATABASE_URL`. Optional `dbPath` selects a
 * disposable schema (test compatibility with former SQLite temp files).
 *
 * Runtime DDL: never on Vercel. Test schemas still apply migrations locally.
 * Docker/local public schema auto-migrates unless `skipMigrations` is set;
 * `npm run migrate` is the operator path for Production (direct URL).
 *
 * @param {string | undefined} databaseUrlOrDbPath When it looks like a path
 *   (contains `/` or ends with `.sqlite`) it is treated as a legacy dbPath.
 * @param {{ databaseUrl?: string, schema?: string | null, skipMigrations?: boolean, dbPath?: string }} [options]
 * @returns {Promise<PgDatabase>}
 */
export async function openDatabase(databaseUrlOrDbPath, options = {}) {
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
  const pool = getSharedPool(databaseUrl);
  const db = new PgDatabase({ pool, databaseUrl, schema });

  if (schema) {
    const client = await pool.connect();
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schema)}`);
      await client.query(`SET search_path TO ${quoteIdent(schema)}, public`);
      db.client = client;
    } catch (error) {
      client.release();
      throw wrapError(error);
    }
  }

  const onVercel = Boolean(process.env.VERCEL);
  const shouldMigrate = !skipMigrations && (!onVercel || Boolean(schema));
  if (shouldMigrate) {
    await applyPendingMigrations(db, MIGRATIONS);
  }
  return db;
}

/** @deprecated Use openDatabase. Kept so transitional imports keep working. */
export async function openSqliteDatabase(dbPath, options = {}) {
  return openDatabase(dbPath, options);
}

/** Starts a write transaction, retrying on serialization/deadlock conflicts. */
export async function beginImmediateWithRetry(db, { retries = 3, backoffMs = 50 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await db.begin();
      return;
    } catch (error) {
      lastError = error;
      if (db.client && !db.schema) {
        try {
          db.client.release();
        } catch {
          // ignore
        }
        db.client = null;
      }
      if (!isSerializationConflictError(error) || attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, backoffMs * (attempt + 1)));
    }
  }
  throw lastError;
}

/** True when a table is visible on the session search_path. */
export async function tableExists(db, name) {
  const row = await db
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
export async function listTableColumns(db, tableName) {
  return await db
    .prepare(
      `SELECT column_name AS name
       FROM information_schema.columns
       WHERE table_schema = ANY (current_schemas(false))
         AND table_name = ?
       ORDER BY ordinal_position`,
    )
    .all(tableName);
}
