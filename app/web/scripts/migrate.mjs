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

export function runMigrate(environment = process.env) {
  const databaseUrl = resolveDatabaseUrl(environment.DATABASE_URL);
  const db = openDatabase(undefined, { databaseUrl });
  try {
    const applied = listAppliedMigrations(db);
    console.log(`DATABASE_URL target ready (${applied.length} migration(s) recorded).`);
    for (const row of applied) console.log(`  - ${row.id} @ ${row.appliedAt}`);
    return applied;
  } finally {
    db.close();
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  runMigrate();
}
