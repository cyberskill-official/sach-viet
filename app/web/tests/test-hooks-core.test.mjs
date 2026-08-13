import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createAuthStore, registerCustomer } from "../src/lib/auth-core.mjs";
import {
  authorizeTestHook,
  readIdentityVerifyHookToken,
  TEST_HOOK_SECRET_HEADER,
  testHooksEnabled,
} from "../src/lib/test-hooks-core.mjs";
import { handleGetVerifyToken } from "../src/lib/test-hooks-http.mjs";

const SECRET = "playwright-local-test-hook-secret";

async function withAuthStore(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-test-hooks-"));
  const store = await createAuthStore({ dbPath: join(directory, "auth.sqlite"), log: () => {} });
  try {
    return await run(store);
  } finally {
    await store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("test hooks stay off on Vercel and without the enable flag", () => {
  assert.equal(testHooksEnabled({}), false);
  assert.equal(testHooksEnabled({ TEST_HOOKS_ENABLED: "1" }), false);
  assert.equal(testHooksEnabled({ TEST_HOOKS_ENABLED: "1", TEST_HOOK_SECRET: "short" }), false);
  assert.equal(testHooksEnabled({ TEST_HOOKS_ENABLED: "1", TEST_HOOK_SECRET: SECRET }), true);
  assert.equal(testHooksEnabled({ TEST_HOOKS_ENABLED: "1", TEST_HOOK_SECRET: SECRET, VERCEL: "1" }), false);
  assert.equal(
    testHooksEnabled({ TEST_HOOKS_ENABLED: "1", TEST_HOOK_SECRET: SECRET, VERCEL_ENV: "production" }),
    false,
  );
});

test("authorizeTestHook 404s when disabled and 401s on a bad secret", () => {
  const env = { TEST_HOOKS_ENABLED: "1", TEST_HOOK_SECRET: SECRET };
  assert.equal(authorizeTestHook(new Headers(), {}).status, 404);
  assert.equal(authorizeTestHook(new Headers({ [TEST_HOOK_SECRET_HEADER]: "nope" }), env).status, 401);
  assert.equal(authorizeTestHook(new Headers({ [TEST_HOOK_SECRET_HEADER]: SECRET }), env).ok, true);
});

test("verify-token hook returns the outbox token and never on Vercel", async () => {
  await withAuthStore(async (store) => {
    const registered = await registerCustomer(store, { email: "hook@example.test", password: "correct horse" });
    const found = await readIdentityVerifyHookToken(store, "hook@example.test");
    assert.equal(found.token, registered.verifyToken);

    const env = { TEST_HOOKS_ENABLED: "1", TEST_HOOK_SECRET: SECRET };
    const ok = await handleGetVerifyToken(
      new Request("http://sachviet.test/api/test/hooks/verify-token?email=hook%40example.test", {
        headers: { [TEST_HOOK_SECRET_HEADER]: SECRET },
      }),
      env,
      { getStore: async () => store },
    );
    assert.equal(ok.status, 200);
    const body = await ok.json();
    assert.equal(body.token, registered.verifyToken);
    assert.equal(body.email, "hook@example.test");

    const vercel = await handleGetVerifyToken(
      new Request("http://sachviet.test/api/test/hooks/verify-token?email=hook%40example.test", {
        headers: { [TEST_HOOK_SECRET_HEADER]: SECRET },
      }),
      { ...env, VERCEL: "1" },
      { getStore: async () => store },
    );
    assert.equal(vercel.status, 404);

    const missing = await handleGetVerifyToken(
      new Request("http://sachviet.test/api/test/hooks/verify-token?email=nobody%40example.test", {
        headers: { [TEST_HOOK_SECRET_HEADER]: SECRET },
      }),
      env,
      { getStore: async () => store },
    );
    assert.equal(missing.status, 404);
  });
});
