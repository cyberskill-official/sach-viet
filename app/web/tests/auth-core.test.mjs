import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { canAccessOwnedRecord, canAccessPortal, normalizeRole } from "../src/lib/access.mjs";
import { bootstrapFirstAdmin, clearLoginLock, createAuthStore, expiredCookie, getIdentitySnapshot, hashPassword, hashPhpassPassword, login, readSession, revokeSession, safeRedirect, syncAdminPasswordFromEnv, verifyPassword } from "../src/lib/auth-core.mjs";

const sessionSecret = "a-session-secret-that-is-long-enough-for-the-test-suite";

async function fixture() {
  const directory = mkdtempSync(resolve(tmpdir(), "sachviet-auth-test-"));
  let clock = 1_700_000_000_000;
  const events = [];
  const store = await createAuthStore({ dbPath: resolve(directory, "auth.sqlite"), now: () => clock, log: (event, fields) => events.push({ event, ...fields }) });
  return {
    directory,
    store,
    events,
    advance(milliseconds) { clock += milliseconds; },
    async close() { await store.close(); rmSync(directory, { force: true, recursive: true }); },
  };
}

async function bootstrap(store, overrides = {}) {
  return await bootstrapFirstAdmin(store, {
    BOOTSTRAP_ADMIN_EMAIL: "admin@example.test",
    BOOTSTRAP_ADMIN_PASSWORD_HASH: hashPassword("correct horse battery staple"),
    AUTH_SESSION_SECRET: sessionSecret,
    ...overrides,
  });
}

test("password hashes verify without exposing the password", async () => {
  const hash = hashPassword("correct horse battery staple");
  assert.equal(verifyPassword("correct horse battery staple", hash), true);
  assert.equal(verifyPassword("wrong password", hash), false);
  assert.equal(hash.includes("correct horse"), false);
  assert.throws(() => hashPassword("short"), /at least 8/);
});

test("bootstrap requires every deployment input and creates one admin only", async () => {
  const testStore = await fixture();
  try {
    assert.deepEqual(await bootstrapFirstAdmin(testStore.store, {}), { created: false, reason: "not_configured" });
    assert.deepEqual(await bootstrap(testStore.store), { created: true, reason: "created" });
    assert.deepEqual(await bootstrap(testStore.store), { created: false, reason: "users_exist" });
    assert.equal((await testStore.store.db.prepare("SELECT COUNT(*) AS count FROM users").get()).count, 1);
    assert.equal(JSON.stringify(testStore.events).includes("admin@example.test"), false);
  } finally { await testStore.close(); }
});

test("bootstrap prefers plain ADMIN_EMAIL and ADMIN_PASSWORD", async () => {
  const testStore = await fixture();
  try {
    assert.deepEqual(
      await bootstrapFirstAdmin(testStore.store, {
        ADMIN_EMAIL: "plain-admin@example.test",
        ADMIN_PASSWORD: "correct horse battery staple",
        AUTH_SESSION_SECRET: sessionSecret,
      }),
      { created: true, reason: "created" },
    );
    const row = await testStore.store.db.prepare("SELECT email, password_hash, role FROM users").get();
    assert.equal(row.email, "plain-admin@example.test");
    assert.equal(row.role, "admin");
    assert.equal(verifyPassword("correct horse battery staple", row.password_hash), true);
    assert.deepEqual(
      await bootstrapFirstAdmin(testStore.store, {
        ADMIN_EMAIL: "plain-admin@example.test",
        ADMIN_PASSWORD: "correct horse battery staple",
        AUTH_SESSION_SECRET: sessionSecret,
      }),
      { created: false, reason: "users_exist" },
    );
  } finally {
    await testStore.close();
  }
});

test("bootstrap falls back to BOOTSTRAP_ADMIN password hash", async () => {
  const testStore = await fixture();
  try {
    assert.deepEqual(
      await bootstrapFirstAdmin(testStore.store, {
        BOOTSTRAP_ADMIN_EMAIL: "hash-admin@example.test",
        BOOTSTRAP_ADMIN_PASSWORD_HASH: hashPassword("correct horse battery staple"),
        AUTH_SESSION_SECRET: sessionSecret,
      }),
      { created: true, reason: "created" },
    );
    const row = await testStore.store.db.prepare("SELECT email FROM users").get();
    assert.equal(row.email, "hash-admin@example.test");
  } finally {
    await testStore.close();
  }
});

test("bootstrap returns users_exist without changing an existing admin", async () => {
  const testStore = await fixture();
  try {
    await bootstrap(testStore.store);
    const before = await testStore.store.db.prepare("SELECT email, password_hash FROM users").get();
    assert.deepEqual(
      await bootstrapFirstAdmin(testStore.store, {
        ADMIN_EMAIL: "other@example.test",
        ADMIN_PASSWORD: "totally-different-password",
        AUTH_SESSION_SECRET: sessionSecret,
      }),
      { created: false, reason: "users_exist" },
    );
    const after = await testStore.store.db.prepare("SELECT email, password_hash FROM users").get();
    assert.equal(after.email, before.email);
    assert.equal(after.password_hash, before.password_hash);
    assert.equal((await testStore.store.db.prepare("SELECT COUNT(*) AS count FROM users").get()).count, 1);
  } finally {
    await testStore.close();
  }
});

test("syncAdminPasswordFromEnv is disabled unless ADMIN_PASSWORD_SYNC=1", async () => {
  const testStore = await fixture();
  try {
    await bootstrap(testStore.store);
    assert.deepEqual(await syncAdminPasswordFromEnv(testStore.store, {}), { synced: false, reason: "disabled" });
    assert.deepEqual(
      await syncAdminPasswordFromEnv(testStore.store, {
        ADMIN_PASSWORD_SYNC: "1",
        ADMIN_EMAIL: "admin@example.test",
        ADMIN_PASSWORD: "new-password-for-sync-test",
        AUTH_SESSION_SECRET: sessionSecret,
      }),
      { synced: true, reason: "updated" },
    );
    const row = await testStore.store.db.prepare("SELECT password_hash FROM users").get();
    assert.equal(verifyPassword("new-password-for-sync-test", row.password_hash), true);
    assert.deepEqual(
      await syncAdminPasswordFromEnv(testStore.store, {
        ADMIN_PASSWORD_SYNC: "1",
        ADMIN_EMAIL: "admin@example.test",
        ADMIN_PASSWORD: "new-password-for-sync-test",
        AUTH_SESSION_SECRET: sessionSecret,
      }),
      { synced: false, reason: "already_current" },
    );
    const loginResult = await login(testStore.store, {
      email: "admin@example.test",
      password: "new-password-for-sync-test",
      sessionSecret,
      clientKey: "test-client",
    });
    assert.equal(loginResult.ok, true);
  } finally {
    await testStore.close();
  }
});

test("getIdentitySnapshot reports user counts without emails", async () => {
  const testStore = await fixture();
  try {
    assert.deepEqual(await getIdentitySnapshot(testStore.store), {
      userCount: 0,
      adminCount: 0,
      bootstrapEligible: true,
    });
    await bootstrap(testStore.store);
    assert.deepEqual(await getIdentitySnapshot(testStore.store), {
      userCount: 1,
      adminCount: 1,
      bootstrapEligible: false,
    });
  } finally {
    await testStore.close();
  }
});

test("failed login is throttled per email+client and never starts a session", async () => {
  const testStore = await fixture();
  try {
    await bootstrap(testStore.store);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      assert.equal(
        (await login(testStore.store, {
          email: "ADMIN@example.test",
          password: "wrong password",
          sessionSecret,
          clientKey: "203.0.113.10",
        })).reason,
        "invalid",
      );
    }
    assert.equal(
      (await login(testStore.store, {
        email: "admin@example.test",
        password: "wrong password",
        sessionSecret,
        clientKey: "203.0.113.10",
      })).reason,
      "throttled",
    );
    assert.equal(
      (await login(testStore.store, {
        email: "admin@example.test",
        password: "correct horse battery staple",
        sessionSecret,
        clientKey: "203.0.113.10",
      })).reason,
      "throttled",
    );
    assert.equal((await testStore.store.db.prepare("SELECT COUNT(*) AS count FROM sessions").get()).count, 0);
    // A different client key must not be locked out by the attacker.
    assert.equal(
      (await login(testStore.store, {
        email: "admin@example.test",
        password: "correct horse battery staple",
        sessionSecret,
        clientKey: "198.51.100.20",
      })).ok,
      true,
    );
    testStore.advance(16 * 60 * 1000);
    assert.equal(
      (await login(testStore.store, {
        email: "admin@example.test",
        password: "correct horse battery staple",
        sessionSecret,
        clientKey: "203.0.113.10",
      })).ok,
      true,
    );
  } finally {
    await testStore.close();
  }
});

test("clearLoginLock unlocks an email without waiting for the lock window", async () => {
  const testStore = await fixture();
  try {
    await bootstrap(testStore.store);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(testStore.store, {
        email: "admin@example.test",
        password: "wrong password",
        sessionSecret,
        clientKey: "203.0.113.10",
      });
    }
    assert.equal(
      (await login(testStore.store, {
        email: "admin@example.test",
        password: "correct horse battery staple",
        sessionSecret,
        clientKey: "203.0.113.10",
      })).reason,
      "throttled",
    );
    await clearLoginLock(testStore.store, "admin@example.test");
    assert.equal(
      (await login(testStore.store, {
        email: "admin@example.test",
        password: "correct horse battery staple",
        sessionSecret,
        clientKey: "203.0.113.10",
      })).ok,
      true,
    );
  } finally {
    await testStore.close();
  }
});

test("successful PHPass login upgrades the stored hash to scrypt", async () => {
  const testStore = await fixture();
  try {
    const password = "imported-password-ok";
    const phpass = hashPhpassPassword(password, { salt: "abcdefgh" });
    await testStore.store.db
      .prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
      .run("user-legacy", "legacy@example.test", phpass, "customer", testStore.store.now());
    const result = await login(testStore.store, {
      email: "legacy@example.test",
      password,
      sessionSecret,
      clientKey: "127.0.0.1",
    });
    assert.equal(result.ok, true);
    const stored = await testStore.store.db.prepare("SELECT password_hash AS hash FROM users WHERE id = ?").get("user-legacy");
    assert.equal(stored.hash.startsWith("scrypt$"), true);
    assert.equal(verifyPassword(password, stored.hash), true);
    assert.ok(testStore.events.some((row) => row.event === "auth_password_rehashed"));
  } finally {
    await testStore.close();
  }
});

test("signed opaque sessions reject tampering, expire, and can be revoked", async () => {
  const testStore = await fixture();
  try {
    await bootstrap(testStore.store);
    const result = await login(testStore.store, { email: "admin@example.test", password: "correct horse battery staple", sessionSecret });
    assert.equal(result.ok, true);
    assert.equal(result.cookie.includes("HttpOnly"), true);
    assert.equal(result.cookie.includes("SameSite=Lax"), true);
    assert.equal(await readSession(testStore.store, `${result.token}changed`, sessionSecret), null);
    assert.equal((await readSession(testStore.store, result.token, sessionSecret)).user.role, "admin");
    await revokeSession(testStore.store, result.token, sessionSecret);
    assert.equal(await readSession(testStore.store, result.token, sessionSecret), null);
    const newResult = await login(testStore.store, { email: "admin@example.test", password: "correct horse battery staple", sessionSecret });
    testStore.advance(25 * 60 * 60 * 1000);
    assert.equal(await readSession(testStore.store, newResult.token, sessionSecret), null);
    assert.equal(expiredCookie().includes("Max-Age=0"), true);
  } finally { await testStore.close(); }
});

test("documented role mapping and ownership checks remain server reusable", async () => {
  assert.equal(normalizeRole("super_admin"), "admin");
  assert.equal(canAccessPortal("vendor", "vendor"), true);
  assert.equal(canAccessPortal("vendor", "admin"), false);
  assert.equal(canAccessPortal("super_admin", "b2b"), true);
  assert.equal(canAccessPortal("employee_b2c", "retail"), true);
  assert.equal(canAccessPortal("employee_b2c", "b2b"), false);
  assert.equal(canAccessOwnedRecord({ id: "user-1", role: "customer" }, "user-1"), true);
  assert.equal(canAccessOwnedRecord({ id: "user-1", role: "customer" }, "user-2"), false);
  assert.equal(canAccessOwnedRecord({ id: "user-1", role: "admin" }, "user-2"), true);
});

test("safe redirects never leave the application origin", async () => {
  assert.equal(safeRedirect("/vendor/orders"), "/vendor/orders");
  assert.equal(safeRedirect("//example.test"), "/");
  assert.equal(safeRedirect("https://example.test"), "/");
  assert.equal(safeRedirect(undefined), "/");
});
