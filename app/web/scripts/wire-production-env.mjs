#!/usr/bin/env node
/**
 * Wire Vercel Production env + optional Supabase migrate.
 *
 * Required env (never commit):
 *   VERCEL_TOKEN
 *   VERCEL_PROJECT_ID   (default: prj_WrbHjx5rpE5TebwbScVmdB5CyPmt)
 *   VERCEL_TEAM_ID      (team slug or id; optional if token is scoped)
 *   DATABASE_URL        (Supabase pooler — written to Vercel Production)
 *   DATABASE_URL_DIRECT (Supabase direct — used for migrate only; not stored on Vercel)
 *   AUTH_SESSION_SECRET (min 32 chars)
 *
 * Optional:
 *   BOOTSTRAP_ADMIN_EMAIL
 *   BOOTSTRAP_ADMIN_PASSWORD_HASH
 *   AI_SETTINGS_SECRET
 *   SKIP_MIGRATE=1
 *   SKIP_REDEPLOY=1
 *
 * Usage (from app/web):
 *   node scripts/wire-production-env.mjs
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN = process.env.VERCEL_TOKEN || "";
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || "prj_WrbHjx5rpE5TebwbScVmdB5CyPmt";
const TEAM_ID = process.env.VERCEL_TEAM_ID || "";
const POOLER = process.env.DATABASE_URL || "";
const DIRECT = process.env.DATABASE_URL_DIRECT || "";
const AUTH_SECRET = process.env.AUTH_SESSION_SECRET || "";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function withTeam(path) {
  if (!TEAM_ID) return path;
  return path.includes("?")
    ? `${path}&teamId=${encodeURIComponent(TEAM_ID)}`
    : `${path}?teamId=${encodeURIComponent(TEAM_ID)}`;
}

async function vercel(path, options = {}) {
  const response = await fetch(`https://api.vercel.com${withTeam(path)}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { _raw: text.slice(0, 400) };
  }
  if (!response.ok) {
    throw new Error(`Vercel ${options.method || "GET"} ${path} → ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function upsertEnv(key, value) {
  // Remove existing Production values for key, then create.
  const existing = await vercel(`/v9/projects/${PROJECT_ID}/env`);
  const envs = Array.isArray(existing?.envs) ? existing.envs : [];
  for (const row of envs) {
    if (row.key === key && Array.isArray(row.target) && row.target.includes("production")) {
      await vercel(`/v9/projects/${PROJECT_ID}/env/${row.id}`, { method: "DELETE" });
    }
  }
  await vercel(`/v10/projects/${PROJECT_ID}/env`, {
    method: "POST",
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: ["production"],
    }),
  });
  console.log(`Set Production env ${key}`);
}

async function redeploy() {
  const body = await vercel(`/v13/deployments`, {
    method: "POST",
    body: JSON.stringify({
      name: "sachviet",
      project: PROJECT_ID,
      target: "production",
      gitSource: {
        type: "github",
        org: "cyberskill-official",
        repo: "sach-viet",
        ref: "main",
      },
    }),
  });
  console.log(`Redeploy requested: ${body?.url || body?.id || JSON.stringify(body)}`);
}

function migrate() {
  if (!DIRECT) fail("DATABASE_URL_DIRECT is required for migrate (or set SKIP_MIGRATE=1).");
  const result = spawnSync("npm", ["run", "migrate"], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: DIRECT },
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) fail("migrate failed");
}

async function main() {
  if (!TOKEN) fail("VERCEL_TOKEN is required");
  if (!POOLER) fail("DATABASE_URL (pooler) is required");
  if (!AUTH_SECRET || AUTH_SECRET.length < 32) fail("AUTH_SESSION_SECRET must be at least 32 characters");

  if (process.env.SKIP_MIGRATE !== "1") {
    console.log("Running migrations against DATABASE_URL_DIRECT…");
    migrate();
  } else {
    console.log("SKIP_MIGRATE=1 — skipping migrate");
  }

  await upsertEnv("DATABASE_URL", POOLER);
  await upsertEnv("AUTH_SESSION_SECRET", AUTH_SECRET);

  if (process.env.BOOTSTRAP_ADMIN_EMAIL) {
    await upsertEnv("BOOTSTRAP_ADMIN_EMAIL", process.env.BOOTSTRAP_ADMIN_EMAIL);
  }
  if (process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH) {
    await upsertEnv("BOOTSTRAP_ADMIN_PASSWORD_HASH", process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH);
  }
  if (process.env.AI_SETTINGS_SECRET) {
    await upsertEnv("AI_SETTINGS_SECRET", process.env.AI_SETTINGS_SECRET);
  }

  if (process.env.SKIP_REDEPLOY !== "1") {
    await redeploy();
  } else {
    console.log("SKIP_REDEPLOY=1 — skipping redeploy");
  }

  console.log("Done. Smoke with: BASE_URL=https://<host> npm run smoke:production");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
