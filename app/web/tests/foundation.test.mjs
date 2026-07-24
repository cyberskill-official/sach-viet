import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { runFoundationVerification, validateFoundation } from "../scripts/verify-foundation.mjs";

const rootPath = resolve(fileURLToPath(new URL("..", import.meta.url)));

function createFixture() {
  const fixtureParent = mkdtempSync(resolve(tmpdir(), "sachviet-foundation-test-"));
  const fixtureRoot = resolve(fixtureParent, "web");

  mkdirSync(resolve(fixtureRoot, "src/app"), { recursive: true });
  writeFileSync(resolve(fixtureRoot, "package.json"), JSON.stringify({
    name: "sachviet-web",
    dependencies: { next: "16.2.11" },
    scripts: { verify: "node scripts/verify-foundation.mjs" },
  }));
  writeFileSync(resolve(fixtureRoot, "next.config.ts"), 'export default { output: "standalone" };');
  writeFileSync(resolve(fixtureRoot, "src/app/layout.tsx"), "export default function Layout() { return null; }");
  writeFileSync(resolve(fixtureRoot, "src/app/page.tsx"), "Greenfield Next.js foundation");
  writeFileSync(resolve(fixtureRoot, "Dockerfile"), "FROM node:24-alpine");
  writeFileSync(resolve(fixtureRoot, "captain-definition"), JSON.stringify({ schemaVersion: 2 }));
  writeFileSync(resolve(fixtureRoot, "OPERATIONS.md"), "Foundation operations.");

  return { fixtureParent, fixtureRoot };
}

function assertValidationError(mutator, expectedMessage) {
  const { fixtureParent, fixtureRoot } = createFixture();

  try {
    mutator(fixtureParent, fixtureRoot);
    assert.throws(() => validateFoundation(fixtureRoot), new RegExp(expectedMessage));
  } finally {
    rmSync(fixtureParent, { force: true, recursive: true });
  }
}

function captureLogs(action) {
  const originalLog = console.log;
  const messages = [];
  console.log = (message) => messages.push(message);

  try {
    action();
  } finally {
    console.log = originalLog;
  }

  return messages.map((message) => JSON.parse(message));
}

test("the Next.js foundation has its required build boundary", () => {
  const result = validateFoundation(rootPath);

  assert.equal(result.name, "sachviet-web");
  assert.match(result.nextVersion, /^16\./);
});

test("the verification command emits safe lifecycle events", () => {
  const events = captureLogs(() => runFoundationVerification(rootPath));

  assert.deepEqual(events.map((event) => event.event), ["foundation_verification_started", "foundation_verification_completed"]);
  assert.equal(events[0].task_id, "TASK-REBUILD-001");
  assert.equal(events[1].application, "sachviet-web");
});

test("the verifier rejects missing required files", () => {
  assertValidationError((_, fixtureRoot) => rmSync(resolve(fixtureRoot, "Dockerfile")), "Missing foundation files");
});

test("the verification command emits a safe failure event", () => {
  const { fixtureParent, fixtureRoot } = createFixture();

  try {
    writeFileSync(resolve(fixtureRoot, ".env"), "SECRET=value");
    let error;
    const events = captureLogs(() => {
      try {
        runFoundationVerification(fixtureRoot);
      } catch (caughtError) {
        error = caughtError;
      }
    });

    assert.match(error.message, /environment file/);
    assert.deepEqual(events.map((event) => event.event), ["foundation_verification_started", "foundation_verification_failed"]);
    assert.equal(events[1].check_id, "foundation_static_checks");
    assert.equal(events[1].error_class, "Error");
    assert.equal(JSON.stringify(events).includes("SECRET=value"), false);
  } finally {
    rmSync(fixtureParent, { force: true, recursive: true });
  }
});

test("the verifier rejects unsupported package metadata", () => {
  assertValidationError((_, fixtureRoot) => writeFileSync(resolve(fixtureRoot, "package.json"), JSON.stringify({
    name: "wrong-name",
    dependencies: { next: "15.5.0" },
    scripts: { verify: "missing" },
  })), "Package name");
  assertValidationError((_, fixtureRoot) => writeFileSync(resolve(fixtureRoot, "package.json"), JSON.stringify({
    name: "sachviet-web",
    dependencies: { next: "15.5.0" },
    scripts: { verify: "node scripts/verify-foundation.mjs" },
  })), "Next.js 16");
  assertValidationError((_, fixtureRoot) => writeFileSync(resolve(fixtureRoot, "package.json"), JSON.stringify({
    name: "sachviet-web",
    dependencies: { next: "16.2.11" },
    scripts: { verify: "missing" },
  })), "verification command");
});

test("the verifier rejects missing packaging and architecture boundaries", () => {
  assertValidationError((_, fixtureRoot) => writeFileSync(resolve(fixtureRoot, "next.config.ts"), "export default {};"), "standalone server output");
  assertValidationError((_, fixtureRoot) => writeFileSync(resolve(fixtureRoot, "src/app/page.tsx"), "no marker"), "expected marker");
  assertValidationError((_, fixtureRoot) => writeFileSync(resolve(fixtureRoot, "captain-definition"), JSON.stringify({ schemaVersion: 1 })), "CapRover schema");
  assertValidationError((fixtureParent) => mkdirSync(resolve(fixtureParent, "api")), "separate API package");
  assertValidationError((_, fixtureRoot) => writeFileSync(resolve(fixtureRoot, ".env"), "SECRET=value"), "environment file");
});
