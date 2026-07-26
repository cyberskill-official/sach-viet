/**
 * One-shot Postgres RPC for Vercel (worker_threads / synckit hang there).
 * Invoked via spawnSync; each call opens a short-lived Client.
 *
 * stdin: JSON message { op, databaseUrl, sql?, params?, mode?, schema? }
 * stdout: JSON { __result } | { __error }
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

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

function quoteIdent(ident) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) {
    throw new Error(`Invalid SQL identifier: ${ident}`);
  }
  return `"${ident}"`;
}

async function withClient(databaseUrl, schema, fn) {
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 8_000,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    if (schema) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schema)}`);
      await client.query(`SET search_path TO ${quoteIdent(schema)}, public`);
    }
    return await fn(client);
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

async function handle(message) {
  const databaseUrl = message.databaseUrl || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for db-rpc-oneshot");

  switch (message.op) {
    case "open":
    case "close":
    case "begin":
      // Sessions are process-local with synckit; on Vercel each RPC is one-shot.
      // begin is a no-op here (auto-commit). Prefer Docker/synckit for strict TX.
      return { ok: true };
    case "query": {
      const text = prepareSql(message.sql);
      const params = message.params || [];
      return withClient(databaseUrl, message.schema || null, async (client) => {
        const result = await client.query(text, params);
        if (message.mode === "get") return result.rows[0];
        if (message.mode === "all") return result.rows;
        return { changes: result.rowCount ?? 0 };
      });
    }
    case "exec": {
      const statements = splitStatements(message.sql || "");
      return withClient(databaseUrl, message.schema || null, async (client) => {
        for (const statement of statements) {
          if (isBegin(statement) || isCommit(statement) || isRollback(statement)) continue;
          await client.query(statement);
        }
        return { ok: true };
      });
    }
    default:
      throw new Error(`Unknown db-rpc op: ${message.op}`);
  }
}

const raw = readFileSync(0, "utf8");
const message = JSON.parse(raw || "{}");
try {
  const result = await handle(message);
  process.stdout.write(JSON.stringify({ __result: result }));
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  process.stdout.write(JSON.stringify({ __error: msg }));
  process.exitCode = 1;
}
