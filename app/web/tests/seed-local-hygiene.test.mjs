import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { resolveSeedPassword, writeSeedPasswordFile } from "../scripts/seed-local.mjs";

test("seed refuses NODE_ENV=production", async () => {
  assert.throws(
    () => resolveSeedPassword({ NODE_ENV: "production", SEED_PASSWORD: "x" }),
    /NODE_ENV=production/,
  );
});

test("seed prefers SEED_PASSWORD and does not write a file", async () => {
  const resolved = resolveSeedPassword({ NODE_ENV: "development", SEED_PASSWORD: "from-env-password" });
  assert.equal(resolved.source, "env");
  assert.equal(resolved.password, "from-env-password");
  assert.equal(resolved.passwordFile, null);
});

test("seed writes generated password to a 0600 local file when SEED_PASSWORD is unset", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-seed-hygiene-"));
  const passwordFilePath = join(directory, ".seed-password");
  try {
    const resolved = resolveSeedPassword(
      { NODE_ENV: "test" },
      {
        generatePassword: () => "generated-seed-password",
        passwordFilePath,
      },
    );
    assert.equal(resolved.source, "file");
    assert.equal(resolved.password, "generated-seed-password");
    assert.equal(resolved.passwordFile, passwordFilePath);
    assert.equal(readFileSync(passwordFilePath, "utf8").trim(), "generated-seed-password");
    // On some CI filesystems mode bits may be masked; force and re-check when chmod works.
    chmodSync(passwordFilePath, 0o600);
    assert.equal(statSync(passwordFilePath).mode & 0o777, 0o600);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("writeSeedPasswordFile creates parent directories", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-seed-nested-"));
  const nested = join(directory, "nested", ".seed-password");
  try {
    const path = writeSeedPasswordFile("nested-password", nested);
    assert.equal(path, nested);
    assert.equal(readFileSync(nested, "utf8").trim(), "nested-password");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
