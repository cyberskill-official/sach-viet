#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TASK_ID_RE = /^(TASK-[A-Z0-9]+-\d+)/;
const GATES = {
  ready_to_test: { name: "review", from: "reviewing", to: "ready_to_test" },
  done: { name: "final", from: "testing", to: "done" },
};

function runGit(root, args, { allowFailure = false } = {}) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
  }
  return result;
}

function repositoryRoot(start = process.cwd()) {
  const result = runGit(start, ["rev-parse", "--show-toplevel"]);
  return result.stdout.trim();
}

function readAtRevision(root, revision, path) {
  const result = runGit(root, ["show", `${revision}:${path}`], { allowFailure: true });
  return result.status === 0 ? result.stdout : null;
}

function frontmatterStatus(text) {
  if (text === null) return null;
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return null;
  const statuses = [...match[1].matchAll(/^status:\s*["']?([a-z_]+)["']?(?:\s+#.*)?$/gm)];
  return statuses.length === 1 ? statuses[0][1] : null;
}

function backlogStatuses(text) {
  const statuses = new Map();
  if (text === null) return statuses;
  for (const match of text.matchAll(/^- \[([a-z_]+)\] (TASK-[A-Z0-9]+-\d+)(?:-\S+)? - /gm)) {
    statuses.set(match[2], match[1]);
  }
  return statuses;
}

function taskIdFromPath(path) {
  const directory = path.split("/").find((part) => TASK_ID_RE.test(part));
  return directory?.match(TASK_ID_RE)?.[1] ?? null;
}

function changedPaths(root, base) {
  const result = runGit(root, ["diff", "--name-status", "--diff-filter=ACMR", base, "HEAD", "--", "docs/tasks"]);
  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status, ...paths] = line.split("\t");
      return { status, path: paths.at(-1) };
    });
}

export function findRequiredVerdicts({ root, base, changes }) {
  const required = new Map();
  const backlogPath = "docs/tasks/BACKLOG.md";

  if (changes.some(({ path }) => path === backlogPath)) {
    const before = backlogStatuses(readAtRevision(root, base, backlogPath));
    const after = backlogStatuses(readAtRevision(root, "HEAD", backlogPath));
    for (const [taskId, status] of after) {
      if (GATES[status] && before.get(taskId) !== status) {
        required.set(`${taskId}:${GATES[status].name}`, { taskId, ...GATES[status] });
      }
    }
  }

  for (const { path } of changes) {
    if (!path.endsWith("/spec.md")) continue;
    const taskId = taskIdFromPath(path);
    const before = frontmatterStatus(readAtRevision(root, base, path));
    const after = frontmatterStatus(readAtRevision(root, "HEAD", path));
    if (taskId && GATES[after] && before !== after) {
      required.set(`${taskId}:${GATES[after].name}`, { taskId, ...GATES[after] });
    }
  }

  return [...required.values()];
}

function validateVerdict(verdict, expected) {
  const errors = [];
  if (verdict.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (verdict.taskId !== expected.taskId) errors.push(`taskId must be ${expected.taskId}`);
  if (verdict.gate !== expected.name) errors.push(`gate must be ${expected.name}`);
  if (verdict.from !== expected.from || verdict.to !== expected.to) {
    errors.push(`transition must be ${expected.from} -> ${expected.to}`);
  }
  if (verdict.verdict !== "accepted") errors.push("verdict must be accepted");
  if (verdict.actor?.type !== "human" || typeof verdict.actor?.name !== "string" || !verdict.actor.name.trim()) {
    errors.push("actor must identify a named human");
  }
  if (typeof verdict.reason !== "string" || !verdict.reason.trim()) errors.push("reason must be non-empty");
  if (typeof verdict.decidedAt !== "string" || Number.isNaN(Date.parse(verdict.decidedAt))) {
    errors.push("decidedAt must be an ISO-8601 timestamp");
  }
  return errors;
}

export function verifyHitlVerdicts({ root, base }) {
  const changes = changedPaths(root, base);
  const required = findRequiredVerdicts({ root, base, changes });
  const addedVerdicts = changes.filter(
    ({ status, path }) => status === "A" && /\/verdicts\/(review|final)-[^/]+\.json$/.test(path),
  );
  const failures = [];

  for (const expected of required) {
    const candidate = addedVerdicts.find(({ path }) => {
      const taskId = taskIdFromPath(path);
      return taskId === expected.taskId && path.includes(`/verdicts/${expected.name}-`);
    });
    if (!candidate) {
      failures.push(
        `${expected.taskId}: ${expected.from} -> ${expected.to} requires a newly added ` +
          `docs/tasks/**/${expected.taskId}-*/verdicts/${expected.name}-*.json`,
      );
      continue;
    }
    try {
      const verdict = JSON.parse(readFileSync(resolve(root, candidate.path), "utf8"));
      for (const error of validateVerdict(verdict, expected)) {
        failures.push(`${candidate.path}: ${error}`);
      }
    } catch (error) {
      failures.push(`${candidate.path}: invalid verdict JSON (${error.message})`);
    }
  }

  return { required, failures };
}

function parseArgs(argv) {
  const baseIndex = argv.indexOf("--base");
  if (baseIndex === -1 || !argv[baseIndex + 1]) {
    throw new Error("usage: node scripts/require-hitl-verdict.mjs --base <git-sha>");
  }
  return { base: argv[baseIndex + 1] };
}

function main() {
  const { base } = parseArgs(process.argv.slice(2));
  const root = repositoryRoot();
  runGit(root, ["rev-parse", "--verify", `${base}^{commit}`]);
  const { required, failures } = verifyHitlVerdicts({ root, base });
  if (failures.length) {
    process.stderr.write(`HITL verdict gate: REFUSED\n${failures.map((item) => `- ${item}`).join("\n")}\n`);
    return 1;
  }
  process.stdout.write(`HITL verdict gate: PASS (${required.length} acceptance transition(s) checked)\n`);
  return 0;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(`HITL verdict gate: ERROR - ${error.message}\n`);
    process.exitCode = 2;
  }
}
