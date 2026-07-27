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
 *   npm run wire:production
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PROJECT_ID = "prj_WrbHjx5rpE5TebwbScVmdB5CyPmt";

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} env
 * @returns {{ ok: true, config: object } | { ok: false, errors: string[] }}
 */
export function validateWireInputs(env) {
  const errors = [];
  const token = env.VERCEL_TOKEN || "";
  const pooler = env.DATABASE_URL || "";
  const direct = env.DATABASE_URL_DIRECT || "";
  const authSecret = env.AUTH_SESSION_SECRET || "";
  const skipMigrate = env.SKIP_MIGRATE === "1";

  if (!token) errors.push("VERCEL_TOKEN is required");
  if (!pooler) errors.push("DATABASE_URL (pooler) is required");
  if (!authSecret || authSecret.length < 32) {
    errors.push("AUTH_SESSION_SECRET must be at least 32 characters");
  }
  if (!skipMigrate && !direct) {
    errors.push("DATABASE_URL_DIRECT is required for migrate (or set SKIP_MIGRATE=1)");
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    config: {
      token,
      projectId: env.VERCEL_PROJECT_ID || DEFAULT_PROJECT_ID,
      teamId: env.VERCEL_TEAM_ID || "",
      pooler,
      direct,
      authSecret,
      skipMigrate,
      skipRedeploy: env.SKIP_REDEPLOY === "1",
      bootstrapEmail: env.BOOTSTRAP_ADMIN_EMAIL || "",
      bootstrapHash: env.BOOTSTRAP_ADMIN_PASSWORD_HASH || "",
      aiSecret: env.AI_SETTINGS_SECRET || "",
    },
  };
}

/**
 * @param {string} path
 * @param {string} teamId
 */
export function withTeam(path, teamId) {
  if (!teamId) return path;
  return path.includes("?")
    ? `${path}&teamId=${encodeURIComponent(teamId)}`
    : `${path}?teamId=${encodeURIComponent(teamId)}`;
}

/**
 * @param {object} options
 * @param {string} options.token
 * @param {string} options.projectId
 * @param {string} options.teamId
 * @param {typeof fetch} [options.fetchImpl]
 */
export function createVercelClient(options) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  return async function vercel(path, init = {}) {
    const response = await fetchImpl(`https://api.vercel.com${withTeam(path, options.teamId)}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${options.token}`,
        "content-type": "application/json",
        ...(init.headers || {}),
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
      throw new Error(
        `Vercel ${init.method || "GET"} ${path} → ${response.status} ${JSON.stringify(body)}`,
      );
    }
    return body;
  };
}

/**
 * @param {(path: string, init?: object) => Promise<any>} vercel
 * @param {string} projectId
 * @param {string} key
 * @param {string} value
 */
export async function upsertProductionEnv(vercel, projectId, key, value) {
  const existing = await vercel(`/v9/projects/${projectId}/env`);
  const envs = Array.isArray(existing?.envs) ? existing.envs : [];
  for (const row of envs) {
    if (row.key === key && Array.isArray(row.target) && row.target.includes("production")) {
      await vercel(`/v9/projects/${projectId}/env/${row.id}`, { method: "DELETE" });
    }
  }
  await vercel(`/v10/projects/${projectId}/env`, {
    method: "POST",
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: ["production"],
    }),
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function migrate(direct) {
  const result = spawnSync("npm", ["run", "migrate"], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: direct },
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) fail("migrate failed");
}

async function main() {
  const validated = validateWireInputs(process.env);
  if (!validated.ok) {
    for (const error of validated.errors) console.error(error);
    process.exit(1);
  }

  const { config } = validated;
  const vercel = createVercelClient({
    token: config.token,
    projectId: config.projectId,
    teamId: config.teamId,
  });

  if (!config.skipMigrate) {
    console.log("Running migrations against DATABASE_URL_DIRECT…");
    migrate(config.direct);
  } else {
    console.log("SKIP_MIGRATE=1 — skipping migrate");
  }

  await upsertProductionEnv(vercel, config.projectId, "DATABASE_URL", config.pooler);
  console.log("Set Production env DATABASE_URL");
  await upsertProductionEnv(vercel, config.projectId, "AUTH_SESSION_SECRET", config.authSecret);
  console.log("Set Production env AUTH_SESSION_SECRET");

  if (config.bootstrapEmail) {
    await upsertProductionEnv(vercel, config.projectId, "BOOTSTRAP_ADMIN_EMAIL", config.bootstrapEmail);
    console.log("Set Production env BOOTSTRAP_ADMIN_EMAIL");
  }
  if (config.bootstrapHash) {
    await upsertProductionEnv(
      vercel,
      config.projectId,
      "BOOTSTRAP_ADMIN_PASSWORD_HASH",
      config.bootstrapHash,
    );
    console.log("Set Production env BOOTSTRAP_ADMIN_PASSWORD_HASH");
  }
  if (config.aiSecret) {
    await upsertProductionEnv(vercel, config.projectId, "AI_SETTINGS_SECRET", config.aiSecret);
    console.log("Set Production env AI_SETTINGS_SECRET");
  }

  if (!config.skipRedeploy) {
    const body = await vercel(`/v13/deployments`, {
      method: "POST",
      body: JSON.stringify({
        name: "sachviet",
        project: config.projectId,
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
  } else {
    console.log("SKIP_REDEPLOY=1 — skipping redeploy");
  }

  console.log("Done. Smoke with: BASE_URL=https://<host> npm run smoke:production");
}

/**
 * Refuse live payment credentials when wiring Production sandbox unlock.
 * @param {Record<string, string | undefined>} paymentEnv
 * @returns {{ ok: true, vars: Record<string, string> } | { ok: false, errors: string[] }}
 */
export function validateSandboxPaymentEnv(paymentEnv = {}) {
  const errors = [];
  const vars = {};

  const stripeSecret = paymentEnv.STRIPE_SECRET_KEY;
  if (stripeSecret) {
    if (stripeSecret.startsWith("sk_live_")) {
      errors.push("STRIPE_SECRET_KEY must be sk_test_… (live keys refused)");
    } else if (!stripeSecret.startsWith("sk_test_")) {
      errors.push("STRIPE_SECRET_KEY must start with sk_test_");
    } else {
      vars.STRIPE_SECRET_KEY = stripeSecret;
    }
  }
  for (const key of ["STRIPE_SUCCESS_URL", "STRIPE_CANCEL_URL", "STRIPE_WEBHOOK_SECRET"]) {
    if (paymentEnv[key]) vars[key] = paymentEnv[key];
  }

  const mode = (paymentEnv.PAYPAL_MODE || "").trim().toLowerCase();
  if (mode === "live") {
    errors.push("PAYPAL_MODE=live is refused; use sandbox");
  } else if (mode && mode !== "sandbox") {
    errors.push("PAYPAL_MODE must be sandbox when set");
  } else if (mode === "sandbox") {
    vars.PAYPAL_MODE = "sandbox";
  }

  for (const key of [
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_RETURN_URL",
    "PAYPAL_CANCEL_URL",
    "PAYPAL_WEBHOOK_ID",
  ]) {
    if (paymentEnv[key]) vars[key] = paymentEnv[key];
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, vars };
}

/**
 * Upsert sandbox/test payment env names onto Vercel Production.
 * @param {(path: string, init?: object) => Promise<any>} vercel
 * @param {string} projectId
 * @param {Record<string, string>} vars
 */
export async function upsertSandboxPaymentEnv(vercel, projectId, vars) {
  for (const [key, value] of Object.entries(vars)) {
    if (!value) continue;
    await upsertProductionEnv(vercel, projectId, key, value);
    console.log(`Set Production env ${key}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
