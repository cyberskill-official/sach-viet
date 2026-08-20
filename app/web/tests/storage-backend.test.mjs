import assert from "node:assert/strict";
import test from "node:test";
import { releaseFingerprint, schemaFingerprint } from "../src/lib/obs-fingerprint.mjs";
import { resolveStorageMode, storageFingerprint, STORAGE_MODES } from "../src/lib/storage-backend.mjs";

test("resolveStorageMode defaults to postgres_bytea", () => {
  assert.equal(resolveStorageMode({}), STORAGE_MODES.postgres_bytea);
  assert.equal(
    resolveStorageMode({ STORAGE_BACKEND: "supabase", SUPABASE_URL: "https://example.supabase.co" }),
    STORAGE_MODES.postgres_bytea,
  );
});

test("resolveStorageMode requires explicit backend flag and all Supabase env names", () => {
  assert.equal(
    resolveStorageMode({
      STORAGE_BACKEND: "supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      SUPABASE_STORAGE_BUCKET: "sv-private-uploads",
    }),
    STORAGE_MODES.supabase,
  );
});

test("storageFingerprint never embeds secret values", () => {
  const fingerprint = storageFingerprint({
    STORAGE_BACKEND: "supabase",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "super-secret-service-role",
    SUPABASE_STORAGE_BUCKET: "sv-private-uploads",
  });
  assert.equal(fingerprint.mode, STORAGE_MODES.supabase);
  assert.equal(fingerprint.supabaseEnvPresent.SUPABASE_SERVICE_ROLE_KEY, true);
  assert.equal(JSON.stringify(fingerprint).includes("super-secret-service-role"), false);
});

test("releaseFingerprint and schemaFingerprint are secret-free", () => {
  const release = releaseFingerprint({
    VERCEL_GIT_COMMIT_SHA: "abc123",
    VERCEL_ENV: "production",
    AUTH_SESSION_SECRET: "x".repeat(32),
  });
  assert.deepEqual(release, { sha: "abc123", deploymentEnv: "production" });
  assert.equal(JSON.stringify(release).includes("x".repeat(32)), false);
  assert.deepEqual(schemaFingerprint(), { name: "public", targetDeferred: "app" });
});
