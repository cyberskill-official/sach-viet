/**
 * Lightweight versioned migrations for Postgres store factories.
 *
 * Migrations are registered in `migrations/registry.mjs` (ordered list of
 * `{ id, up(db) }`). The runner records applied ids in `schema_migrations`.
 * Prefer additive DDL. Canonical CREATE TABLE lives in numbered migrations.
 */

const appliedDbs = new WeakSet();

async function ensureLedger(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at BIGINT NOT NULL
    );
  `);
}

/**
 * Applies any pending migrations from the provided ordered list.
 * Safe to call on every `openDatabase` (non-Vercel); already-applied ids are skipped.
 */
export async function applyPendingMigrations(db, migrations, { log } = {}) {
  if (appliedDbs.has(db)) return { applied: [] };
  await ensureLedger(db);
  const applied = new Set(
    (await db.prepare("SELECT id FROM schema_migrations").all()).map((row) => row.id),
  );
  const newlyApplied = [];
  const insert = db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)");
  for (const migration of migrations) {
    if (!migration?.id || typeof migration.up !== "function") {
      throw new Error("Each migration must export { id, up }.");
    }
    if (applied.has(migration.id)) continue;
    await db.exec("BEGIN");
    try {
      await migration.up(db);
      await insert.run(migration.id, Date.now());
      await db.exec("COMMIT");
      newlyApplied.push(migration.id);
      log?.("schema_migration_applied", { result: "accepted", migration_id: migration.id });
    } catch (error) {
      try {
        await db.exec("ROLLBACK");
      } catch {
        // ignore rollback errors when the transaction never started
      }
      throw error;
    }
  }
  appliedDbs.add(db);
  return { applied: newlyApplied };
}

/** @deprecated Use applyPendingMigrations. */
export async function applyPendingMigrationsSync(db, migrations, options) {
  return applyPendingMigrations(db, migrations, options);
}

export async function listAppliedMigrations(db) {
  await ensureLedger(db);
  return db
    .prepare("SELECT id, applied_at AS \"appliedAt\" FROM schema_migrations ORDER BY id ASC")
    .all();
}
