import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  PREPARE_OUTCOMES,
  QUALITY_CHECK_IDS,
  assertNoNetworkDeployInSource,
  detectPreviewCredentials,
  getQualityChecklist,
  preparePreviewRelease,
  validatePreviewPackaging,
} from "../src/lib/quality-preview-release-core.mjs";

const appRoot = join(import.meta.dirname, "..");

test("quality checklist enumerates lint test verify build and cyberos gates", async () => {
  const checklist = getQualityChecklist();
  assert.deepEqual(
    checklist.checks.map((check) => check.id),
    [...QUALITY_CHECK_IDS],
  );
  assert.ok(checklist.checks.some((check) => check.command.includes("run-gates.sh")));
});

test("preview packaging validation accepts the greenfield app/web package", async () => {
  const packaging = validatePreviewPackaging(appRoot);
  assert.equal(packaging.schemaVersion, 2);
  assert.equal(packaging.standalone, true);
});

test("credential absence yields prepared_local without deploy", async () => {
  const events = [];
  const result = preparePreviewRelease({
    rootPath: appRoot,
    credentials: { present: false, source: null },
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  assert.equal(result.outcome, PREPARE_OUTCOMES.PREPARED_LOCAL);
  assert.equal(result.deployed, false);
  assert.equal(result.credentials_present, false);
  assert.ok(events.some((entry) => entry.event === "preview_release_prepare_completed"));
});

test("production target is refused even when credentials appear present", async () => {
  const result = preparePreviewRelease({
    rootPath: appRoot,
    target: "production",
    credentials: { present: true, source: "CAPROVER_APP_TOKEN" },
    log() {},
  });
  assert.equal(result.outcome, PREPARE_OUTCOMES.REFUSED_PRODUCTION);
  assert.equal(result.deployed, false);
});

test("authorizeRemote without operator path is refused", async () => {
  const result = preparePreviewRelease({
    rootPath: appRoot,
    authorizeRemote: true,
    credentials: detectPreviewCredentials({ CAPROVER_APP_TOKEN: "token-value" }),
    log() {},
  });
  assert.equal(result.outcome, PREPARE_OUTCOMES.REFUSED_UNAUTHORIZED_REMOTE);
  assert.equal(result.deployed, false);
});

test("invalid packaging returns packaging_invalid", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-preview-"));
  try {
    mkdirSync(join(directory, "nested"), { recursive: true });
    writeFileSync(join(directory, "package.json"), "{}");
    const result = preparePreviewRelease({
      rootPath: directory,
      credentials: { present: false, source: null },
      log() {},
    });
    assert.equal(result.outcome, PREPARE_OUTCOMES.PACKAGING_INVALID);
    assert.equal(result.deployed, false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("default-path source forbids network deploy primitives", async () => {
  const source = readFileSync(join(appRoot, "src/lib/quality-preview-release-core.mjs"), "utf8");
  assert.equal(assertNoNetworkDeployInSource(source), true);
  assert.throws(() => assertNoNetworkDeployInSource('await fetch("https://captain.server.sachviet.us")'));
  assert.throws(() => assertNoNetworkDeployInSource(null));
});

test("credential detection accepts CapRover or Captain env names", async () => {
  assert.deepEqual(detectPreviewCredentials({}), { present: false, source: null });
  assert.equal(detectPreviewCredentials({ CAPROVER_APP_TOKEN: " token " }).source, "CAPROVER_APP_TOKEN");
  assert.equal(detectPreviewCredentials({ CAPTAIN_APP_TOKEN: "alt" }).source, "CAPTAIN_APP_TOKEN");
});

test("validatePreviewPackaging rejects broken packaging contracts", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-preview-bad-"));
  try {
    for (const file of ["package.json", "Dockerfile", "captain-definition", "OPERATIONS.md", "next.config.ts"]) {
      writeFileSync(join(directory, file), "placeholder");
    }
    writeFileSync(join(directory, "captain-definition"), JSON.stringify({ schemaVersion: 1, dockerfilePath: "./Dockerfile" }));
    assert.throws(() => validatePreviewPackaging(directory), /schemaVersion 2/);

    writeFileSync(
      join(directory, "captain-definition"),
      JSON.stringify({ schemaVersion: 2, dockerfilePath: "./other.Dockerfile" }),
    );
    assert.throws(() => validatePreviewPackaging(directory), /\.\/Dockerfile/);

    writeFileSync(
      join(directory, "captain-definition"),
      JSON.stringify({ schemaVersion: 2, dockerfilePath: "./Dockerfile" }),
    );
    writeFileSync(join(directory, "Dockerfile"), "FROM alpine\n");
    assert.throws(() => validatePreviewPackaging(directory), /Node base image/);

    writeFileSync(join(directory, "Dockerfile"), "FROM node:24-alpine\nRUN npm run build\n");
    writeFileSync(join(directory, "next.config.ts"), "export default {};\n");
    assert.throws(() => validatePreviewPackaging(directory), /standalone/);

    writeFileSync(join(directory, "next.config.ts"), 'export default { output: "standalone" };\n');
    writeFileSync(join(directory, ".env"), "SECRET=1\n");
    assert.throws(() => validatePreviewPackaging(directory), /\.env/);
    rmSync(join(directory, ".env"));

    writeFileSync(join(directory, "OPERATIONS.md"), "incomplete\n");
    assert.throws(() => validatePreviewPackaging(directory), /missing quality\/preview marker/);

    writeFileSync(
      join(directory, "OPERATIONS.md"),
      ["npm run lint", "npm run test", "npm run verify", "npm run build", "run-gates.sh", "CapRover", "prepared_local", "Do not deploy"].join("\n"),
    );
    writeFileSync(join(directory, "package.json"), JSON.stringify({ scripts: { verify: "echo" } }));
    assert.throws(() => validatePreviewPackaging(directory), /quality-preview-release verification/);

    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({
        scripts: {
          verify: "node scripts/verify-quality-preview-release-core.mjs",
        },
      }),
    );
    assert.throws(() => validatePreviewPackaging(directory), /prepare:preview/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("unsupported prepare target throws before packaging work", async () => {
  assert.throws(
    () =>
      preparePreviewRelease({
        rootPath: appRoot,
        target: "staging",
        credentials: { present: false, source: null },
        log() {},
      }),
    /Unsupported prepare target/,
  );
});

test("prepare without rootPath throws", async () => {
  assert.throws(() => preparePreviewRelease({ log() {} }), /rootPath is required/);
});
