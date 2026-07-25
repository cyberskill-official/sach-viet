import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { generateSeedPassword, seedLocalData } from "../src/lib/seed-local-core.mjs";

export function runSeedLocal(environment = process.env) {
  const dbPath = environment.DATABASE_PATH || "/data/sachviet.sqlite";
  const password = environment.SEED_PASSWORD || generateSeedPassword();
  const summary = seedLocalData({ dbPath, password, env: environment });

  console.log(`Seeded ${summary.databasePath}`);
  console.log(`  bootstrap admin: ${summary.bootstrapAdmin}`);
  console.log(`  created this run: ${JSON.stringify(summary.created)}`);
  console.log(`  totals: ${JSON.stringify(summary.totals)}`);
  console.log("  accounts (local development only):");
  for (const account of summary.accounts) console.log(`    ${account.role.padEnd(8)} ${account.email}`);
  console.log(`  password for every seeded account: ${summary.password}`);
  console.log("  Set SEED_PASSWORD to choose the password. Never reuse it outside local development.");
  return summary;
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  runSeedLocal();
}
