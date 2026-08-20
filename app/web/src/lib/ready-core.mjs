import { MIGRATIONS } from "../../migrations/registry.mjs";
import { openDatabase } from "./db.mjs";
import { listAppliedMigrations } from "./migrate.mjs";
import { releaseFingerprint, schemaFingerprint } from "./obs-fingerprint.mjs";
import { storageFingerprint } from "./storage-backend.mjs";

/** Env keys whose *presence* is required for readiness (values never returned). */
export const REQUIRED_READY_ENV = Object.freeze(["DATABASE_URL", "AUTH_SESSION_SECRET", "CRON_SECRET"]);

function envPresence(env, keys) {
  /** @type {Record<string, boolean>} */
  const presence = {};
  let ok = true;
  for (const key of keys) {
    const present = typeof env[key] === "string" && env[key].trim() !== "";
    presence[key] = present;
    if (!present) ok = false;
  }
  return { presence, ok };
}

/**
 * Readiness snapshot: DB ping, latest applied migration id, oldest pending
 * outbox age, required env presence, plus safe release/schema/storage fingerprints.
 * Never includes secret values or raw DB errors.
 */
export async function getReadiness({ env = process.env, db = null, now = Date.now } = {}) {
  const required = envPresence(env, REQUIRED_READY_ENV);
  const expectedLatest = MIGRATIONS[MIGRATIONS.length - 1]?.id || null;
  /** @type {{ ok: boolean, db: string, migration: { latest: string | null }, outbox: { oldestPendingAgeMs: number | null }, env: Record<string, boolean>, release: { sha: string | null, deploymentEnv: string | null }, schema: { name: string, targetDeferred: string }, storage: { mode: string, supabaseEnvPresent: Record<string, boolean> } }} */
  const snapshot = {
    ok: false,
    db: "error",
    migration: { latest: null },
    outbox: { oldestPendingAgeMs: null },
    env: required.presence,
    release: releaseFingerprint(env),
    schema: schemaFingerprint(),
    storage: storageFingerprint(env),
  };

  if (!db && !required.presence.DATABASE_URL) {
    return snapshot;
  }

  let owned = false;
  let database = db;
  try {
    if (!database) {
      database = await openDatabase(undefined, { databaseUrl: env.DATABASE_URL });
      owned = true;
    }
    const ping = await database.prepare("SELECT 1 AS ok").get();
    if (Number(ping?.ok) !== 1) {
      return snapshot;
    }
    snapshot.db = "ok";
    const applied = await listAppliedMigrations(database);
    snapshot.migration.latest = applied.length ? applied[applied.length - 1].id : null;
    const oldest = await database
      .prepare("SELECT MIN(created_at) AS oldest FROM order_comms_outbox WHERE status = 'pending'")
      .get();
    if (oldest?.oldest != null) {
      snapshot.outbox.oldestPendingAgeMs = Math.max(0, Number(now()) - Number(oldest.oldest));
    }
  } catch {
    snapshot.db = "error";
    snapshot.migration.latest = null;
    snapshot.outbox.oldestPendingAgeMs = null;
  } finally {
    if (owned && database) {
      try {
        await database.close();
      } catch {
        // ignore
      }
    }
  }

  const migrationOk = snapshot.migration.latest === expectedLatest;
  snapshot.ok = snapshot.db === "ok" && required.ok && migrationOk;
  return snapshot;
}
