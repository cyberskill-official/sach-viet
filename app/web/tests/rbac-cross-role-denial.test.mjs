import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  can,
  permissionForApiPath,
} from "../src/lib/access.mjs";
import {
  COOKIE_NAME,
  createSessionCookie,
  decodeSessionRoleFromToken,
  getAuthStore,
  hashPassword,
  resetAuthStoreForTests,
} from "../src/lib/auth-core.mjs";
import { requireApiPermission } from "../src/lib/authz-http.mjs";

const sessionSecret = "a-session-secret-that-is-long-enough-for-the-test-suite";
const databaseUrl = process.env.DATABASE_URL || "postgres://sachviet:sachviet@127.0.0.1:5432/sachviet";
const root = resolve(import.meta.dirname, "..");

async function withUsers(run) {
  const previousSecret = process.env.AUTH_SESSION_SECRET;
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.AUTH_SESSION_SECRET = sessionSecret;
  process.env.DATABASE_URL = databaseUrl;
  await resetAuthStoreForTests();
  const store = await getAuthStore();
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const addUser = async (id, role) => {
    const userId = `${id}-${suffix}`;
    await store.db
      .prepare("INSERT INTO users (id, email, password_hash, role, created_at, email_verified_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(userId, `${userId}@example.test`, hashPassword("correct horse battery staple"), role, 1000, 1000);
    return createSessionCookie(store, { id: userId, role }, sessionSecret);
  };
  try {
    return await run({ store, addUser, suffix });
  } finally {
    await store.db.prepare("DELETE FROM sessions WHERE user_id LIKE ?").run(`%-${suffix}`);
    await store.db.prepare("DELETE FROM users WHERE id LIKE ?").run(`%-${suffix}`);
    await store.close();
    await resetAuthStoreForTests();
    if (previousSecret === undefined) delete process.env.AUTH_SESSION_SECRET;
    else process.env.AUTH_SESSION_SECRET = previousSecret;
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  }
}

function request(path, { method = "GET", token, body } = {}) {
  const headers = { cookie: `${COOKIE_NAME}=${token}` };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }
  return new Request(`http://sachviet.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const crossRoleCases = [
  { role: "customer", path: "/api/admin/flags", method: "GET", expectStatus: 403 },
  { role: "vendor", path: "/api/admin/flags", method: "GET", expectStatus: 403 },
  { role: "customer", path: "/api/finance/compute", method: "POST", expectStatus: 403, body: { kind: "settlement" } },
  { role: "vendor", path: "/api/finance/compute", method: "POST", expectStatus: 403, body: { kind: "settlement" } },
  { role: "customer", path: "/api/vendor/offers", method: "GET", expectStatus: 403 },
  { role: "author", path: "/api/vendor/offers", method: "GET", expectStatus: 403 },
  { role: "customer", path: "/api/support/tickets/ticket-1", method: "PATCH", expectStatus: 403, body: { assigneeId: "staff-1" } },
  { role: "vendor", path: "/api/support/tickets/ticket-1", method: "PATCH", expectStatus: 403, body: { assigneeId: "staff-1" } },
];

test("cross-role HTTP denial via requireApiPermission", async () => {
  await withUsers(async ({ addUser, suffix }) => {
    const sessions = {
      customer: (await addUser("customer-1", "customer")).token,
      vendor: (await addUser("vendor-1", "vendor")).token,
      admin: (await addUser("admin-1", "admin")).token,
      employee: (await addUser("employee-1", "employee")).token,
      author: (await addUser("author-1", "author")).token,
    };
    for (const testCase of crossRoleCases) {
      const token = sessions[testCase.role];
      const auth = await requireApiPermission(request(testCase.path, {
        method: testCase.method,
        token,
        body: testCase.body,
      }));
      assert.equal(auth.ok, false, `${testCase.role} ${testCase.method} ${testCase.path} should be denied`);
      assert.equal(auth.response.status, testCase.expectStatus, `${testCase.role} ${testCase.method} ${testCase.path}`);
    }
    const allowedAdminFlags = await requireApiPermission(request("/api/admin/flags", { token: sessions.admin }));
    assert.equal(allowedAdminFlags.ok, true);
    const allowedVendorOffers = await requireApiPermission(request("/api/vendor/offers", { token: sessions.vendor }));
    assert.equal(allowedVendorOffers.ok, true);
    const allowedStaffPatch = await requireApiPermission(request("/api/support/tickets/ticket-1", {
      method: "PATCH",
      token: sessions.employee,
      body: { assigneeId: `employee-1-${suffix}` },
    }));
    assert.equal(allowedStaffPatch.ok, true);
  });
});

test("permission matrix maps staff support ticket mutations to support.tickets.staff", () => {
  assert.equal(permissionForApiPath("/api/support/tickets/abc", "PATCH"), "support.tickets.staff");
  assert.equal(permissionForApiPath("/api/support/tickets/abc/messages", "POST"), "support.tickets.own");
  assert.equal(permissionForApiPath("/api/support/tickets", "POST"), "support.tickets.own");
  assert.equal(can({ id: "c1", role: "customer" }, "support.tickets.staff"), false);
  assert.equal(can({ id: "e1", role: "employee" }, "support.tickets.staff"), true);
});

test("vendor.apply is customer-only in the permission matrix", () => {
  assert.equal(can({ id: "c1", role: "customer" }, "vendor.apply"), true);
  assert.equal(can({ id: "v1", role: "vendor" }, "vendor.apply"), false);
  assert.equal(can({ id: "a1", role: "admin" }, "vendor.apply"), false);
});

test("signed session tokens embed a decodable role claim for edge gating", async () => {
  await withUsers(async ({ addUser }) => {
    const customer = await addUser("customer-claim", "customer");
    assert.equal(decodeSessionRoleFromToken(customer.token, sessionSecret), "customer");
    const admin = await addUser("admin-claim", "admin");
    assert.equal(decodeSessionRoleFromToken(admin.token, sessionSecret), "admin");
    assert.equal(decodeSessionRoleFromToken("legacy-id.legacy-sig", sessionSecret), null);
  });
});

test("proxy fail-closed portal HTML gating redirects forbidden roles", () => {
  const source = readFileSync(resolve(root, "src/proxy.ts"), "utf8");
  assert.match(source, /decodeSessionRoleFromToken/);
  assert.match(source, /canAccessPortal/);
  assert.match(source, /redirectToForbidden/);
  assert.match(source, /\/forbidden/);
});
