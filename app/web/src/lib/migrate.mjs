/**
 * Lightweight versioned migrations for Postgres store factories.
 *
 * Migrations are registered in `migrations/registry.mjs` (ordered list of
 * `{ id, up(db) }`). The runner records applied ids in `schema_migrations`.
 * Prefer additive DDL. Canonical CREATE TABLE lives in numbered migrations.
 */

const appliedDbs = new WeakSet();

function ensureLedger(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at BIGINT NOT NULL
    );
  `);
}

/**
 * Applies any pending migrations from the provided ordered list.
 * Safe to call on every `openDatabase`; already-applied ids are skipped.
 */
export function applyPendingMigrationsSync(db, migrations, { log } = {}) {
  if (appliedDbs.has(db)) return { applied: [] };
  ensureLedger(db);
  const applied = new Set(
    db.prepare("SELECT id FROM schema_migrations").all().map((row) => row.id),
  );
  const newlyApplied = [];
  const insert = db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)");
  for (const migration of migrations) {
    if (!migration?.id || typeof migration.up !== "function") {
      throw new Error("Each migration must export { id, up }.");
    }
    if (applied.has(migration.id)) continue;
    db.exec("BEGIN");
    try {
      migration.up(db);
      insert.run(migration.id, Date.now());
      db.exec("COMMIT");
      newlyApplied.push(migration.id);
      log?.("schema_migration_applied", { result: "accepted", migration_id: migration.id });
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // ignore rollback errors when the transaction never started
      }
      throw error;
    }
  }
  appliedDbs.add(db);
  return { applied: newlyApplied };
}

export function listAppliedMigrations(db) {
  ensureLedger(db);
  return db
    .prepare("SELECT id, applied_at AS \"appliedAt\" FROM schema_migrations ORDER BY id ASC")
    .all();
}
