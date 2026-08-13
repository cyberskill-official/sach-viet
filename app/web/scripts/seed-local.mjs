import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { generateSeedPassword, seedLocalData } from "../src/lib/seed-local-core.mjs";

/** Default local file for generated seed passwords (mode 0600). Never commit. */
export const DEFAULT_SEED_PASSWORD_FILE = ".seed-password";

/**
 * Resolve the seed password without dumping it to stdout by default.
 * - Refuse NODE_ENV=production.
 * - Prefer SEED_PASSWORD from the environment.
 * - Otherwise generate one and write it to a 0600 local file.
 */
export function resolveSeedPassword(environment = process.env, {
  generatePassword = generateSeedPassword,
  writePasswordFile = writeSeedPasswordFile,
  passwordFilePath = environment.SEED_PASSWORD_FILE || DEFAULT_SEED_PASSWORD_FILE,
} = {}) {
  if (environment.NODE_ENV === "production") {
    throw new Error("seed:local refuses to run when NODE_ENV=production.");
  }

  const fromEnv = typeof environment.SEED_PASSWORD === "string" ? environment.SEED_PASSWORD : "";
  if (fromEnv.length > 0) {
    return { password: fromEnv, source: "env", passwordFile: null };
  }

  const password = generatePassword();
  const passwordFile = writePasswordFile(password, passwordFilePath);
  return { password, source: "file", passwordFile };
}

export function writeSeedPasswordFile(password, filePath = DEFAULT_SEED_PASSWORD_FILE) {
  const destination = resolve(filePath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, `${password}\n`, { encoding: "utf8", mode: 0o600 });
  // mode on writeFileSync is umask-affected for existing files; force 0600.
  chmodSync(destination, 0o600);
  return destination;
}

export async function runSeedLocal(environment = process.env, options = {}) {
  const { password, source, passwordFile } = resolveSeedPassword(environment, options);
  const databaseUrl = environment.DATABASE_URL;
  const dbPath = environment.DATABASE_PATH;
  const summary = await seedLocalData({ databaseUrl, dbPath, password, env: environment });

  console.log(`Seeded ${summary.databaseUrl}`);
  console.log(`  bootstrap admin: ${summary.bootstrapAdmin}`);
  console.log(`  created this run: ${JSON.stringify(summary.created)}`);
  console.log(`  totals: ${JSON.stringify(summary.totals)}`);
  console.log("  accounts (local development only):");
  for (const account of summary.accounts) console.log(`    ${account.role.padEnd(8)} ${account.email}`);
  if (source === "env") {
    console.log("  password: taken from SEED_PASSWORD (not printed).");
  } else {
    console.log(`  password: written to ${passwordFile} (mode 0600); not printed to stdout.`);
  }
  console.log("  Never reuse the seed password outside local development.");
  return { ...summary, passwordSource: source, passwordFile };
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  runSeedLocal().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
