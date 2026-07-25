/**
 * Transitional re-exports. Prefer importing from `./db.mjs`.
 * CapRover/SQLite path is deprecated; local Docker and CI use Postgres.
 */
export {
  DEFAULT_BUSY_TIMEOUT_MS,
  DEFAULT_DATABASE_URL,
  beginImmediateWithRetry,
  isSerializationConflictError,
  isSqliteBusyError,
  isUniqueViolationError,
  listTableColumns,
  openDatabase,
  openSqliteDatabase,
  PgDatabase,
  resolveDatabaseUrl,
  schemaFromDbPath,
  tableExists,
} from "./db.mjs";
