/**
 * synckit worker: owns pg Pool/Client sessions so the main thread can call
 * Postgres synchronously through createSyncFn (see db.mjs).
 */
import pg from "pg";
import { runAsWorker } from "synckit";

const { Pool, types } = pg;

// BIGINT / COUNT(*) come back as strings by default; app code expects numbers.
types.setTypeParser(types.builtins.INT8, (value) => Number(value));

/** @type {Map<string, { pool: import("pg").Pool, client: import("pg").PoolClient | null, schema: string | null, ownsPool: boolean }>} */
const sessions = new Map();

/** @type {Map<string, import("pg").Pool>} */
const sharedPools = new Map();

function quoteIdent(ident) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) {
    throw new Error(`Invalid SQL identifier: ${ident}`);
  }
  return `"${ident}"`;
}

function isLocalDatabaseHost(databaseUrl) {
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

function poolOptions(databaseUrl) {
  const onVercel = Boolean(process.env.VERCEL);
  const local = isLocalDatabaseHost(databaseUrl);
  return {
    connectionString: databaseUrl,
    // Serverless: keep pools tiny; reuse across warm invocations via the Map.
    max: onVercel ? 1 : 10,
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: onVercel ? 5_000 : 30_000,
    // Supabase / remote Postgres require TLS; Compose `db` and loopback do not.
    ...(local ? {} : { ssl: { rejectUnauthorized: true } }),
  };
}

function getSharedPool(databaseUrl) {
  let pool = sharedPools.get(databaseUrl);
  if (!pool) {
    pool = new Pool(poolOptions(databaseUrl));
    sharedPools.set(databaseUrl, pool);
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

function prepareSql(sql) {
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

async function runner(session) {
  if (session.client) return session.client;
  return session.pool;
}

async function ensureSearchPath(session, client) {
  if (!session.schema) return;
  await client.query(`SET search_path TO ${quoteIdent(session.schema)}, public`);
}

async function openSession({ id, databaseUrl, schema }) {
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  if (sessions.has(id)) throw new Error(`Database session already open: ${id}`);

  const pool = getSharedPool(databaseUrl);
  const session = { pool, client: null, schema: schema || null, ownsPool: false };
  sessions.set(id, session);

  if (schema) {
    const client = await pool.connect();
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schema)}`);
      await client.query(`SET search_path TO ${quoteIdent(schema)}, public`);
      session.client = client;
    } catch (error) {
      client.release();
      sessions.delete(id);
      throw error;
    }
  }

  return { ok: true };
}

async function closeSession({ id }) {
  const session = sessions.get(id);
  if (!session) return { ok: true };
  if (session.client) {
    try {
      await session.client.query("ROLLBACK");
    } catch {
      // ignore — no open transaction
    }
    session.client.release();
    session.client = null;
  }
  sessions.delete(id);
  return { ok: true };
}

async function beginSession({ id, retries = 3, backoffMs = 50 }) {
  const session = sessions.get(id);
  if (!session) throw new Error(`Unknown database session: ${id}`);
  if (session.client && !session.schema) {
    // already in a transaction on a checked-out client
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (!session.client) {
        session.client = await session.pool.connect();
        await ensureSearchPath(session, session.client);
      } else if (session.schema) {
        // schema sessions already hold a client; start a transaction on it
      } else {
        await ensureSearchPath(session, session.client);
      }
      await session.client.query("BEGIN");
      return { ok: true };
    } catch (error) {
      lastError = error;
      if (session.client && !session.schema) {
        session.client.release();
        session.client = null;
      }
      if (!isSerializationError(error) || attempt >= retries) break;
      await new Promise((resolve) => setTimeout(resolve, backoffMs * (attempt + 1)));
    }
  }
  throw lastError;
}

async function execSession({ id, sql }) {
  const session = sessions.get(id);
  if (!session) throw new Error(`Unknown database session: ${id}`);

  const statements = splitStatements(sql);
  for (const statement of statements) {
    if (isBegin(statement)) {
      await beginSession({ id });
      continue;
    }
    if (isCommit(statement)) {
      if (!session.client) throw new Error("COMMIT without an open transaction.");
      await session.client.query("COMMIT");
      if (!session.schema) {
        session.client.release();
        session.client = null;
      }
      continue;
    }
    if (isRollback(statement)) {
      if (!session.client) throw new Error("ROLLBACK without an open transaction.");
      await session.client.query("ROLLBACK");
      if (!session.schema) {
        session.client.release();
        session.client = null;
      }
      continue;
    }
    const client = await runner(session);
    if (client === session.pool && session.schema) {
      const borrowed = await session.pool.connect();
      try {
        await ensureSearchPath(session, borrowed);
        await borrowed.query(statement);
      } finally {
        borrowed.release();
      }
    } else {
      await ensureSearchPath(session, client);
      await client.query(statement);
    }
  }
  return { ok: true };
}

async function querySession({ id, sql, params = [], mode }) {
  const session = sessions.get(id);
  if (!session) throw new Error(`Unknown database session: ${id}`);
  const text = prepareSql(sql);
  const client = await runner(session);

  let result;
  if (client === session.pool && session.schema) {
    const borrowed = await session.pool.connect();
    try {
      await ensureSearchPath(session, borrowed);
      result = await borrowed.query(text, params);
    } finally {
      borrowed.release();
    }
  } else {
    if (session.client) await ensureSearchPath(session, session.client);
    result = await client.query(text, params);
  }

  if (mode === "get") return result.rows[0];
  if (mode === "all") return result.rows;
  return { changes: result.rowCount ?? 0 };
}

runAsWorker(async (message) => {
  switch (message.op) {
    case "open":
      return openSession(message);
    case "close":
      return closeSession(message);
    case "exec":
      return execSession(message);
    case "query":
      return querySession(message);
    case "begin":
      return beginSession(message);
    default:
      throw new Error(`Unknown db worker op: ${message.op}`);
  }
});
