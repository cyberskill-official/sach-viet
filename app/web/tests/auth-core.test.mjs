import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { canAccessOwnedRecord, canAccessPortal, normalizeRole } from "../src/lib/access.mjs";
import { bootstrapFirstAdmin, createAuthStore, expiredCookie, hashPassword, login, readSession, revokeSession, safeRedirect, verifyPassword } from "../src/lib/auth-core.mjs";

const sessionSecret = "a-session-secret-that-is-long-enough-for-the-test-suite";

function fixture() {
  const directory = mkdtempSync(resolve(tmpdir(), "sachviet-auth-test-"));
  let clock = 1_700_000_000_000;
  const events = [];
  const store = createAuthStore({ dbPath: resolve(directory, "auth.sqlite"), now: () => clock, log: (event, fields) => events.push({ event, ...fields }) });
  return {
    directory,
    store,
    events,
    advance(milliseconds) { clock += milliseconds; },
    close() { store.close(); rmSync(directory, { force: true, recursive: true }); },
  };
}

function bootstrap(store, overrides = {}) {
  return bootstrapFirstAdmin(store, {
    BOOTSTRAP_ADMIN_EMAIL: "admin@example.test",
    BOOTSTRAP_ADMIN_PASSWORD_HASH: hashPassword("correct horse battery staple"),
    AUTH_SESSION_SECRET: sessionSecret,
    ...overrides,
  });
}

test("password hashes verify without exposing the password", () => {
  const hash = hashPassword("correct horse battery staple");
  assert.equal(verifyPassword("correct horse battery staple", hash), true);
  assert.equal(verifyPassword("wrong password", hash), false);
  assert.equal(hash.includes("correct horse"), false);
  assert.throws(() => hashPassword("short"), /at least 8/);
});

test("bootstrap requires every deployment input and creates one admin only", () => {
  const testStore = fixture();
  try {
    assert.deepEqual(bootstrapFirstAdmin(testStore.store, {}), { created: false, reason: "not_configured" });
    assert.deepEqual(bootstrap(testStore.store), { created: true, reason: "created" });
    assert.deepEqual(bootstrap(testStore.store), { created: false, reason: "users_exist" });
    assert.equal(testStore.store.db.prepare("SELECT COUNT(*) AS count FROM users").get().count, 1);
    assert.equal(JSON.stringify(testStore.events).includes("admin@example.test"), false);
  } finally { testStore.close(); }
});

test("failed login is throttled per normalized email and never starts a session", () => {
  const testStore = fixture();
  try {
    bootstrap(testStore.store);
    for (let attempt = 0; attempt < 4; attempt += 1) assert.equal(login(testStore.store, { email: "ADMIN@example.test", password: "wrong password", sessionSecret }).reason, "invalid");
    assert.equal(login(testStore.store, { email: "admin@example.test", password: "wrong password", sessionSecret }).reason, "throttled");
    assert.equal(login(testStore.store, { email: "admin@example.test", password: "correct horse battery staple", sessionSecret }).reason, "throttled");
    assert.equal(testStore.store.db.prepare("SELECT COUNT(*) AS count FROM sessions").get().count, 0);
    testStore.advance(16 * 60 * 1000);
    assert.equal(login(testStore.store, { email: "admin@example.test", password: "correct horse battery staple", sessionSecret }).ok, true);
  } finally { testStore.close(); }
});

test("signed opaque sessions reject tampering, expire, and can be revoked", () => {
  const testStore = fixture();
  try {
    bootstrap(testStore.store);
    const result = login(testStore.store, { email: "admin@example.test", password: "correct horse battery staple", sessionSecret });
    assert.equal(result.ok, true);
    assert.equal(result.cookie.includes("HttpOnly"), true);
    assert.equal(result.cookie.includes("SameSite=Lax"), true);
    assert.equal(readSession(testStore.store, `${result.token}changed`, sessionSecret), null);
    assert.equal(readSession(testStore.store, result.token, sessionSecret).user.role, "admin");
    revokeSession(testStore.store, result.token, sessionSecret);
    assert.equal(readSession(testStore.store, result.token, sessionSecret), null);
    const newResult = login(testStore.store, { email: "admin@example.test", password: "correct horse battery staple", sessionSecret });
    testStore.advance(25 * 60 * 60 * 1000);
    assert.equal(readSession(testStore.store, newResult.token, sessionSecret), null);
    assert.equal(expiredCookie().includes("Max-Age=0"), true);
  } finally { testStore.close(); }
});

test("documented role mapping and ownership checks remain server reusable", () => {
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

test("safe redirects never leave the application origin", () => {
  assert.equal(safeRedirect("/vendor/orders"), "/vendor/orders");
  assert.equal(safeRedirect("//example.test"), "/");
  assert.equal(safeRedirect("https://example.test"), "/");
  assert.equal(safeRedirect(undefined), "/");
});
