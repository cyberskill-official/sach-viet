#!/usr/bin/env node
/**
 * Apply pending Postgres migrations against DATABASE_URL.
 *
 * Usage:
 *   DATABASE_URL=postgres://… npm run migrate
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { openDatabase, resolveDatabaseUrl } from "../src/lib/db.mjs";
import { listAppliedMigrations } from "../src/lib/migrate.mjs";

export async function runMigrate(environment = process.env) {
  const databaseUrl = resolveDatabaseUrl(environment.DATABASE_URL);
  const db = await openDatabase(undefined, { databaseUrl });
  try {
    const applied = await listAppliedMigrations(db);
    console.log(`DATABASE_URL target ready (${applied.length} migration(s) recorded).`);
    for (const row of applied) console.log(`  - ${row.id} @ ${row.appliedAt}`);
    return applied;
  } finally {
    await db.close();
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  runMigrate().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
