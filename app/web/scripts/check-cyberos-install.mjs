#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

function repoRoot() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.trim() || "not inside a Git repository");
  return result.stdout.trim();
}

function manifestValue(text, key) {
  return new RegExp(`^${key}:\\s*([^\\s#]+)`, "m").exec(text)?.[1] ?? null;
}

function main() {
  const root = repoRoot();
  const optional = process.argv.includes("--if-present");
  const installRoot = resolve(root, ".cyberos");
  if (!existsSync(installRoot)) {
    if (optional) {
      process.stdout.write("CyberOS pin: SKIP (.cyberos local install is absent)\n");
      return 0;
    }
    throw new Error(".cyberos local install is absent");
  }

  const expected = JSON.parse(
    readFileSync(resolve(root, "docs/governance/cyberos-install.json"), "utf8"),
  );
  const manifest = readFileSync(resolve(installRoot, "manifest.yaml"), "utf8");
  const gates = readFileSync(resolve(installRoot, "cuo/gates/run-gates.sh"), "utf8");
  const actual = {
    cyberosVersion: manifestValue(manifest, "cyberos_version"),
    rulesSha: manifestValue(manifest, "rules_sha"),
    builtFromCommit: manifestValue(manifest, "built_from_commit"),
  };
  const failures = [];

  for (const key of ["cyberosVersion", "rulesSha", "builtFromCommit"]) {
    if (actual[key] !== expected[key]) {
      failures.push(`${key}: expected ${expected[key]}, found ${actual[key] ?? "missing"}`);
    }
  }
  if (expected.requireNoEval && /(^|[;&|(\s])eval(?:\s|$)/m.test(gates)) {
    failures.push("run-gates.sh still executes commands through eval");
  }
  if (!gates.includes('command "${argv[@]}"')) {
    failures.push("run-gates.sh does not contain the expected argv execution path");
  }
  const gatesSha256 = createHash("sha256").update(gates).digest("hex");
  if (gatesSha256 !== expected.runGatesSha256) {
    failures.push(
      `runGatesSha256: expected ${expected.runGatesSha256}, found ${gatesSha256}`,
    );
  }

  if (failures.length) {
    process.stderr.write(`CyberOS pin: FAIL\n${failures.map((item) => `- ${item}`).join("\n")}\n`);
    return 1;
  }
  process.stdout.write(
    `CyberOS pin: PASS (${actual.cyberosVersion}, rules ${actual.rulesSha.slice(0, 12)}…)\n`,
  );
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  process.stderr.write(`CyberOS pin: ERROR - ${error.message}\n`);
  process.exitCode = 2;
}
