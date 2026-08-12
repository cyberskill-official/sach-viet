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
]);
