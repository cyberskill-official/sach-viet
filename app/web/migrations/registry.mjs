/**
 * Ordered schema migrations. Add new entries at the end; never reorder or
 * rewrite an already-shipped `id`. Keep each `up` additive.
 *
 * Wave 1 folded dual-owned CREATE TABLE definitions into `001_initial_schema`
 * so store factories no longer own DDL.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Prefer cwd/`migrations` so Next Turbopack does not rewrite
 * `fileURLToPath(import.meta.url)` into a broken media path during build.
 * Dockerfile copies SQL into `/app/migrations` beside the standalone server.
 */
function migrationsDir() {
  const candidate = join(process.cwd(), "migrations");
  if (!existsSync(join(candidate, "001_initial_schema.sql"))) {
    throw new Error(`migrations SQL not found under ${candidate} (cwd=${process.cwd()})`);
  }
  return candidate;
}

function loadSql(name) {
  return readFileSync(join(migrationsDir(), name), "utf8");
}

/**
 * pg_trgm must live in `public`. Isolated test schemas set search_path to
 * `t_*, public`. Creating the extension while a test schema is first on the
 * path installs it into that schema; later suites then hit IF NOT EXISTS and
 * cannot see `%` / gin_trgm_ops. Move or create it in public via the pool
 * (no test-schema search_path).
 */
async function ensurePgTrgmInPublic(db) {
  const existing = await db.pool.query(`
    SELECT n.nspname AS schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_trgm'
  `);
  const schema = existing.rows[0]?.schema;
  if (!schema) {
    await db.pool.query("CREATE EXTENSION pg_trgm WITH SCHEMA public");
    return;
  }
  if (schema === "public") return;
  try {
    await db.pool.query("ALTER EXTENSION pg_trgm SET SCHEMA public");
  } catch {
    await db.pool.query("DROP EXTENSION pg_trgm CASCADE");
    await db.pool.query("CREATE EXTENSION pg_trgm WITH SCHEMA public");
  }
}

export const MIGRATIONS = Object.freeze([
  {
    id: "001_initial_schema",
    async up(db) {
      await db.exec(loadSql("001_initial_schema.sql"));
    },
  },
  {
    id: "002_ai_settings",
    async up(db) {
      await db.exec(loadSql("002_ai_settings.sql"));
    },
  },
  {
    id: "003_payment_provider",
    async up(db) {
      await db.exec(loadSql("003_payment_provider.sql"));
    },
  },
  {
    id: "004_identity_jobs_payments",
    async up(db) {
      await db.exec(loadSql("004_identity_jobs_payments.sql"));
    },
  },
  {
    id: "005_order_expiry_inventory",
    async up(db) {
      await db.exec(loadSql("005_order_expiry_inventory.sql"));
    },
  },
  {
    id: "006_portal_search_fulfillment",
    async up(db) {
      await ensurePgTrgmInPublic(db);
      await db.exec(loadSql("006_portal_search_fulfillment.sql"));
    },
  },
  {
    id: "007_storage_object_registry",
    async up(db) {
      await db.exec(loadSql("007_storage_object_registry.sql"));
    },
  },
]);
