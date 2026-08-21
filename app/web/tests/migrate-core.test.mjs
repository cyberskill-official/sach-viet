import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { MIGRATIONS } from "../migrations/registry.mjs";
import { applyPendingMigrationsSync, listAppliedMigrations } from "../src/lib/migrate.mjs";
import { openDatabase, tableExists } from "../src/lib/db.mjs";

test("openDatabase applies the migration registry once", async () => {
  const dbPath = `/tmp/sachviet-migrate-test-${randomUUID()}`;
  const db = await openDatabase(dbPath);
  try {
    const applied = await listAppliedMigrations(db);
    assert.ok(applied.some((row) => row.id === "001_initial_schema"));
    assert.ok(applied.some((row) => row.id === "002_ai_settings"));
    assert.ok(applied.some((row) => row.id === "005_order_expiry_inventory"));
    assert.ok(applied.some((row) => row.id === "006_portal_search_fulfillment"));
    assert.ok(applied.some((row) => row.id === "007_storage_object_registry"));
    assert.ok(applied.some((row) => row.id === "008_user_tour_progress"));
    assert.ok(await tableExists(db, "user_addresses"));
    assert.ok(await tableExists(db, "user_tour_progress"));
    const trgm = await db.pool.query(`
      SELECT n.nspname AS schema
      FROM pg_extension e
      JOIN pg_namespace n ON n.oid = e.extnamespace
      WHERE e.extname = 'pg_trgm'
    `);
    assert.equal(trgm.rows[0]?.schema, "public");
    const hit = await db.query("SELECT CAST('tieng viet' AS text) OPERATOR(public.%) CAST('tieng' AS text) AS matched", [], "get");
    assert.equal(hit.matched, true);
    assert.ok(await tableExists(db, "user_channel_endpoints"));
    assert.ok(await tableExists(db, "ai_settings"));
    const second = await applyPendingMigrationsSync(db, MIGRATIONS);
    assert.deepEqual(second.applied, []);
  } finally {
    await db.close();
  }
});
