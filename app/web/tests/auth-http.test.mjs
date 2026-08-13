import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { handleForgotPassword, handleRegister, handleResetPassword, handleVerifyEmail } from "../src/lib/auth-http.mjs";
import { createAuthStore, login, registerCustomer, requestPasswordReset, resetPassword, verifyEmail } from "../src/lib/auth-core.mjs";

const sessionSecret = "a-session-secret-that-is-long-enough-for-the-test-suite";

test("register verify and login succeed; unverified login is refused", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-auth-reg-"));
  const store = await createAuthStore({ dbPath: join(directory, "auth.sqlite"), log: () => {} });
  try {
    const registered = await registerCustomer(store, { email: "new@example.test", password: "correct horse" });
    assert.equal(registered.user.role, "customer");
    const blocked = await login(store, {
      email: "new@example.test",
      password: "correct horse",
      sessionSecret,
    });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.reason, "unverified");
    await verifyEmail(store, registered.verifyToken);
    const allowed = await login(store, {
      email: "new@example.test",
      password: "correct horse",
      sessionSecret,
    });
    assert.equal(allowed.ok, true);
    const reset = await requestPasswordReset(store, "new@example.test");
    const changed = await resetPassword(store, {
      token: reset.resetToken,
      password: "new horse battery",
      sessionSecret,
    });
    assert.equal(changed.user.email, "new@example.test");
    const afterReset = await login(store, {
      email: "new@example.test",
      password: "new horse battery",
      sessionSecret,
    });
    assert.equal(afterReset.ok, true);
  } finally {
    await store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("auth HTTP handlers reject invalid bodies without grepping route files", async () => {
  const unique = `${randomBytes(6).toString("hex")}@example.test`;
  const bad = await handleRegister(new Request("http://sachviet.test/api/auth/register", { method: "POST", body: "null" }));
  assert.equal(bad.status, 400);
  const forgot = await handleForgotPassword(
    new Request("http://sachviet.test/api/auth/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: unique }),
    }),
  );
  assert.equal(forgot.status, 200);
  const verify = await handleVerifyEmail(new Request("http://sachviet.test/api/auth/verify?token=short"));
  assert.equal(verify.status, 400);
  const reset = await handleResetPassword(
    new Request("http://sachviet.test/api/auth/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "nope", password: "short" }),
    }),
  );
  assert.equal(reset.status, 400);
});
