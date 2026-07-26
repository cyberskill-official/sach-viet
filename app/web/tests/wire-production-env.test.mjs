import assert from "node:assert/strict";
import test from "node:test";
import {
  upsertProductionEnv,
  validateWireInputs,
  withTeam,
} from "../scripts/wire-production-env.mjs";

test("validateWireInputs fails closed without VERCEL_TOKEN", () => {
  const result = validateWireInputs({
    DATABASE_URL: "postgres://pooler",
    DATABASE_URL_DIRECT: "postgres://direct",
    AUTH_SESSION_SECRET: "x".repeat(32),
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /VERCEL_TOKEN/.test(e)));
});

test("validateWireInputs fails closed when AUTH_SESSION_SECRET is short", () => {
  const result = validateWireInputs({
    VERCEL_TOKEN: "tok",
    DATABASE_URL: "postgres://pooler",
    DATABASE_URL_DIRECT: "postgres://direct",
    AUTH_SESSION_SECRET: "too-short",
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /AUTH_SESSION_SECRET/.test(e)));
});

test("validateWireInputs requires DATABASE_URL_DIRECT unless SKIP_MIGRATE=1", () => {
  const missing = validateWireInputs({
    VERCEL_TOKEN: "tok",
    DATABASE_URL: "postgres://pooler",
    AUTH_SESSION_SECRET: "x".repeat(32),
  });
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.some((e) => /DATABASE_URL_DIRECT/.test(e)));

  const skipped = validateWireInputs({
    VERCEL_TOKEN: "tok",
    DATABASE_URL: "postgres://pooler",
    AUTH_SESSION_SECRET: "x".repeat(32),
    SKIP_MIGRATE: "1",
  });
  assert.equal(skipped.ok, true);
  assert.equal(skipped.config.skipMigrate, true);
});

test("validateWireInputs accepts a complete env", () => {
  const result = validateWireInputs({
    VERCEL_TOKEN: "tok",
    DATABASE_URL: "postgres://pooler",
    DATABASE_URL_DIRECT: "postgres://direct",
    AUTH_SESSION_SECRET: "x".repeat(32),
    VERCEL_PROJECT_ID: "prj_custom",
  });
  assert.equal(result.ok, true);
  assert.equal(result.config.projectId, "prj_custom");
  assert.equal(result.config.pooler, "postgres://pooler");
});

test("withTeam appends teamId query param", () => {
  assert.equal(withTeam("/v9/projects/p/env", ""), "/v9/projects/p/env");
  assert.equal(withTeam("/v9/projects/p/env", "team_1"), "/v9/projects/p/env?teamId=team_1");
  assert.equal(withTeam("/v9/projects/p/env?limit=1", "team_1"), "/v9/projects/p/env?limit=1&teamId=team_1");
});

test("upsertProductionEnv deletes existing production key then creates", async () => {
  /** @type {string[]} */
  const calls = [];
  const vercel = async (path, init = {}) => {
    calls.push(`${init.method || "GET"} ${path}`);
    if (path === "/v9/projects/prj/env" && !init.method) {
      return {
        envs: [
          { id: "env_old", key: "DATABASE_URL", target: ["production"] },
          { id: "env_preview", key: "DATABASE_URL", target: ["preview"] },
        ],
      };
    }
    return {};
  };

  await upsertProductionEnv(vercel, "prj", "DATABASE_URL", "postgres://pooler");
  assert.deepEqual(calls, [
    "GET /v9/projects/prj/env",
    "DELETE /v9/projects/prj/env/env_old",
    "POST /v10/projects/prj/env",
  ]);
});
