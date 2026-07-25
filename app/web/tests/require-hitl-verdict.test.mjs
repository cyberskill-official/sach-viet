import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyHitlVerdicts } from "../scripts/require-hitl-verdict.mjs";

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function commit(root, message) {
  git(root, "add", ".");
  git(root, "-c", "user.name=HITL Test", "-c", "user.email=hitl@example.invalid", "commit", "-m", message);
  return git(root, "rev-parse", "HEAD");
}

function writeTask(root, status) {
  const taskDir = join(root, "docs/tasks/improvement/TASK-IMP-999-hitl-test");
  mkdirSync(taskDir, { recursive: true });
  writeFileSync(join(taskDir, "spec.md"), `---\nid: TASK-IMP-999\nstatus: ${status}\n---\n# Test task\n`);
  mkdirSync(join(root, "docs/tasks"), { recursive: true });
  writeFileSync(
    join(root, "docs/tasks/BACKLOG.md"),
    `- [${status}] TASK-IMP-999-hitl-test - HITL test (improvement)\n`,
  );
  return taskDir;
}

function fixture({ withVerdict }) {
  const root = mkdtempSync(join(tmpdir(), "sachviet-hitl-"));
  git(root, "init", "-q");
  writeTask(root, "testing");
  const base = commit(root, "base");
  const taskDir = writeTask(root, "done");
  if (withVerdict) {
    const verdictDir = join(taskDir, "verdicts");
    mkdirSync(verdictDir, { recursive: true });
    writeFileSync(
      join(verdictDir, "final-2026-07-25.json"),
      JSON.stringify({
        schemaVersion: 1,
        taskId: "TASK-IMP-999",
        gate: "final",
        from: "testing",
        to: "done",
        verdict: "accepted",
        actor: { type: "human", name: "Test Operator" },
        decidedAt: "2026-07-25T14:00:00Z",
        reason: "Reviewed the machine-gate evidence.",
      }),
    );
  }
  commit(root, "transition");
  return { root, base };
}

test("final acceptance transition fails closed without a new human verdict", () => {
  const { root, base } = fixture({ withVerdict: false });
  try {
    const result = verifyHitlVerdicts({ root, base });
    assert.equal(result.required.length, 1);
    assert.match(result.failures.join("\n"), /requires a newly added/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("matching newly added human verdict authorizes the final transition", () => {
  const { root, base } = fixture({ withVerdict: true });
  try {
    const result = verifyHitlVerdicts({ root, base });
    assert.equal(result.required.length, 1);
    assert.deepEqual(result.failures, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
