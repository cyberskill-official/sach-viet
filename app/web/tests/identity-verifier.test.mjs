import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runIdentityVerification, validateIdentity } from "../scripts/verify-identity.mjs";

const rootPath = resolve(fileURLToPath(new URL("..", import.meta.url)));

function createFixture() {
  const root = mkdtempSync(resolve(tmpdir(), "sachviet-identity-verifier-"));
  for (const file of ["src/lib/auth-core.mjs", "src/lib/access.mjs", "src/app/api/auth/login/route.ts", "src/app/api/auth/logout/route.ts", "src/app/api/auth/me/route.ts", "src/app/login/page.tsx", "src/proxy.ts"]) {
    mkdirSync(resolve(root, file, ".."), { recursive: true });
    writeFileSync(resolve(root, file), "HttpOnly SameSite=Lax login_attempts AUTH_SESSION_SECRET");
  }
  writeFileSync(resolve(root, "Dockerfile"), "DATABASE_URL");
  writeFileSync(resolve(root, "OPERATIONS.md"), "BOOTSTRAP_ADMIN_PASSWORD_HASH DATABASE_URL");
  return root;
}

test("identity verifier accepts the application boundary", () => {
  assert.equal(validateIdentity(rootPath).requiredFileCount, 7);
});

test("identity verifier rejects an incomplete identity boundary", () => {
  const root = createFixture();
  try {
    rmSync(resolve(root, "src/proxy.ts"));
    assert.throws(() => validateIdentity(root), /Missing identity files/);
  } finally { rmSync(root, { force: true, recursive: true }); }
});

test("identity verifier rejects missing security and deployment checks", () => {
  const cases = [
    { file: "src/lib/auth-core.mjs", contents: "SameSite=Lax login_attempts AUTH_SESSION_SECRET", message: /httpOnly/ },
    { file: "src/lib/auth-core.mjs", contents: "HttpOnly SameSite=Lax", message: /throttling/ },
    { file: "OPERATIONS.md", contents: "BOOTSTRAP_ADMIN_PASSWORD_HASH", message: /DATABASE_URL|Postgres/ },
    { file: "OPERATIONS.md", contents: "DATABASE_URL", message: /secret guidance/ },
    { file: "OPERATIONS.md", contents: "BOOTSTRAP_ADMIN_PASSWORD_HASH=not-a-secret\nDATABASE_URL", message: /must not be documented/ },
  ];
  for (const testCase of cases) {
    const root = createFixture();
    try {
      writeFileSync(resolve(root, testCase.file), testCase.contents);
      assert.throws(() => validateIdentity(root), testCase.message);
    } finally { rmSync(root, { force: true, recursive: true }); }
  }
});

test("identity verifier emits a safe failure event", () => {
  const root = createFixture();
  const originalLog = console.log;
  const events = [];
  console.log = (message) => events.push(JSON.parse(message));
  try {
    rmSync(resolve(root, "src/proxy.ts"));
    assert.throws(() => runIdentityVerification(root), /Missing identity files/);
  } finally {
    console.log = originalLog;
    rmSync(root, { force: true, recursive: true });
  }
  assert.deepEqual(events.map((event) => event.event), ["identity_verification_started", "identity_verification_failed"]);
});

test("identity verifier emits redacted lifecycle events", () => {
  const originalLog = console.log;
  const events = [];
  console.log = (message) => events.push(JSON.parse(message));
  try { runIdentityVerification(rootPath); } finally { console.log = originalLog; }
  assert.deepEqual(events.map((event) => event.event), ["identity_verification_started", "identity_verification_completed"]);
  assert.equal(JSON.stringify(events).includes("AUTH_SESSION_SECRET="), false);
});
