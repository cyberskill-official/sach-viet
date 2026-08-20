/**
 * Safe release / environment fingerprints for probes (TASK-PLT-002).
 * Never includes secret values — SHA and env names only.
 */

export function releaseFingerprint(env = process.env) {
  const sha =
    (typeof env.VERCEL_GIT_COMMIT_SHA === "string" && env.VERCEL_GIT_COMMIT_SHA.trim()) ||
    (typeof env.GIT_COMMIT_SHA === "string" && env.GIT_COMMIT_SHA.trim()) ||
    null;
  const deploymentEnv =
    (typeof env.VERCEL_ENV === "string" && env.VERCEL_ENV.trim()) ||
    (typeof env.NODE_ENV === "string" && env.NODE_ENV.trim()) ||
    null;
  return {
    sha: sha || null,
    deploymentEnv: deploymentEnv || null,
  };
}

/** Current schema name per DEC-OPS-001 interim (public until dedicated package). */
export function schemaFingerprint() {
  return { name: "public", targetDeferred: "app" };
}
