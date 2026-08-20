/**
 * Storage backend resolution for PKG-08 scaffolding (TASK-PLT-002).
 * Default remains Postgres BYTEA. Supabase Storage is documented and detectable
 * but not activated until a dedicated cutover package lands.
 */

export const STORAGE_MODES = Object.freeze({
  postgres_bytea: "postgres_bytea",
  supabase: "supabase",
});

/**
 * Resolve the configured storage mode from env presence (values never returned).
 * Supabase mode is reported only when all three names are non-empty *and*
 * STORAGE_BACKEND=supabase. Otherwise postgres_bytea stays active.
 */
export function resolveStorageMode(env = process.env) {
  const requested = typeof env.STORAGE_BACKEND === "string" ? env.STORAGE_BACKEND.trim().toLowerCase() : "";
  if (requested === "supabase") {
    const url = typeof env.SUPABASE_URL === "string" && env.SUPABASE_URL.trim() !== "";
    const key = typeof env.SUPABASE_SERVICE_ROLE_KEY === "string" && env.SUPABASE_SERVICE_ROLE_KEY.trim() !== "";
    const bucket = typeof env.SUPABASE_STORAGE_BUCKET === "string" && env.SUPABASE_STORAGE_BUCKET.trim() !== "";
    if (url && key && bucket) {
      return STORAGE_MODES.supabase;
    }
  }
  return STORAGE_MODES.postgres_bytea;
}

/**
 * Safe fingerprint for readiness / ops docs. Never includes secrets or bucket
 * contents — only mode + whether optional Supabase env names are present.
 */
export function storageFingerprint(env = process.env) {
  return {
    mode: resolveStorageMode(env),
    supabaseEnvPresent: {
      SUPABASE_URL: typeof env.SUPABASE_URL === "string" && env.SUPABASE_URL.trim() !== "",
      SUPABASE_SERVICE_ROLE_KEY:
        typeof env.SUPABASE_SERVICE_ROLE_KEY === "string" && env.SUPABASE_SERVICE_ROLE_KEY.trim() !== "",
      SUPABASE_STORAGE_BUCKET:
        typeof env.SUPABASE_STORAGE_BUCKET === "string" && env.SUPABASE_STORAGE_BUCKET.trim() !== "",
    },
  };
}
