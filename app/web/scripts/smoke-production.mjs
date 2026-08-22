#!/usr/bin/env node
/**
 * Production smoke (Phase A).
 *
 * Usage:
 *   BASE_URL=https://<production-host> npm run smoke:production
 *   BASE_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run smoke:production
 *   (falls back to BOOTSTRAP_ADMIN_* or SMOKE_ADMIN_*)
 *
 * Optional: VERCEL_PROTECTION_BYPASS=<secret> for Deployment Protection.
 * Does not invent catalog seed data. Unpaid checkout is the commerce proof (Stripe deferred).
 */
import { pathToFileURL } from "node:url";

const COOKIE_NAME = "sv_session";

/**
 * @param {Headers | { getSetCookie?: () => string[], get: (name: string) => string | null }} headers
 * @param {string} [cookieName]
 */
export function cookieFromSetCookie(headers, cookieName = COOKIE_NAME) {
  const raw = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  const list = raw.length > 0 ? raw : [headers.get("set-cookie")].filter(Boolean);
  for (const line of list) {
    const match = String(line).match(new RegExp(`${cookieName}=([^;]+)`));
    if (match) return `${cookieName}=${match[1]}`;
  }
  return null;
}

/**
 * @param {{ bypass?: string, extra?: Record<string, string> }} [opts]
 */
export function baseHeaders(opts = {}) {
  /** @type {Record<string, string>} */
  const headers = { accept: "application/json", ...(opts.extra || {}) };
  if (opts.bypass) headers["x-vercel-protection-bypass"] = opts.bypass;
  return headers;
}

/**
 * @param {{ ok: boolean, id: string, detail?: string }[]} results
 * @param {{ ok: boolean, id: string, detail?: string }} check
 * @param {(line: string) => void} [log]
 */
export function recordCheck(results, check, log = console.log) {
  results.push(check);
  log(`[${check.ok ? "PASS" : "FAIL"}] ${check.id}${check.detail ? ` — ${check.detail}` : ""}`);
}

/**
 * Hard-fail ids for process exit. Skipped required checks fail the gate.
 * @param {{ ok: boolean, id: string, detail?: string }[]} results
 */
export function hardFailureIds(results) {
  const required = new Set(["health-postgres", "catalog-list", "admin-login", "checkout-pending-path"]);
  return results
    .filter((r) => required.has(r.id) && (!r.ok || /Skipped/i.test(r.detail || "")))
    .map((r) => r.id);
}

/**
 * @param {object} options
 * @param {string} options.baseUrl
 * @param {typeof fetch} [options.fetchImpl]
 * @param {string} [options.adminEmail]
 * @param {string} [options.adminPassword]
 * @param {string} [options.bypass]
 * @param {(line: string) => void} [options.log]
 */
export async function runProductionSmoke(options) {
  const baseUrl = (options.baseUrl || "").replace(/\/$/, "");
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const adminEmail = options.adminEmail || "";
  const adminPassword = options.adminPassword || "";
  const bypass = options.bypass || "";
  const log = options.log || console.log;
  /** @type {{ ok: boolean, id: string, detail?: string }[]} */
  const results = [];

  if (!baseUrl) {
    return {
      ok: false,
      exitCode: 2,
      results,
      error: "BASE_URL is required (Production origin, no trailing slash).",
    };
  }

  log(`Production smoke against ${baseUrl}`);

  async function fetchJson(path, init = {}) {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: baseHeaders({
        bypass,
        extra: {
          ...(init.body ? { "content-type": "application/json" } : {}),
          ...(init.headers || {}),
        },
      }),
      redirect: "manual",
    });
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { _raw: text.slice(0, 240) };
    }
    return { response, body, text };
  }

  try {
    const { response, body } = await fetchJson("/api/health");
    const ok = response.status === 200 && body?.ok === true;
    recordCheck(
      results,
      {
        id: "health-postgres",
        ok,
        detail: ok
          ? `HTTP ${response.status} live`
          : `HTTP ${response.status} body=${JSON.stringify(body)}`,
      },
      log,
    );
    if (!ok) {
      return { ok: false, exitCode: 1, results };
    }
  } catch (error) {
    recordCheck(
      results,
      {
        id: "health-postgres",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      },
      log,
    );
    return { ok: false, exitCode: 1, results };
  }

  const catalog = await fetchJson("/api/catalog/products");
  const products = Array.isArray(catalog.body?.items)
    ? catalog.body.items
    : Array.isArray(catalog.body?.products)
      ? catalog.body.products
      : [];
  recordCheck(
    results,
    {
      id: "catalog-list",
      ok: catalog.response.status === 200,
      detail: `HTTP ${catalog.response.status} count=${products.length}`,
    },
    log,
  );

  if (adminEmail && adminPassword) {
    const login = await fetchJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const cookie = cookieFromSetCookie(login.response.headers);
    const loginOk = login.response.status === 200 && Boolean(cookie);
    recordCheck(
      results,
      {
        id: "admin-login",
        ok: loginOk,
        detail: loginOk ? adminEmail : `HTTP ${login.response.status} ${login.body?.error || ""}`.trim(),
      },
      log,
    );

    if (loginOk && cookie) {
      const me = await fetchJson("/api/auth/me", { headers: { cookie } });
      recordCheck(
        results,
        {
          id: "admin-session",
          ok: me.response.status === 200 && me.body?.user?.role === "admin",
          detail: `role=${me.body?.user?.role || "none"}`,
        },
        log,
      );
    }
  } else {
    recordCheck(
      results,
      {
        id: "admin-login",
        ok: false,
        detail:
          "Skipped — set ADMIN_EMAIL + ADMIN_PASSWORD (or BOOTSTRAP_*/SMOKE_*) to verify login",
      },
      log,
    );
  }

  const checkout = await fetchJson("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ items: [], provider: "stripe" }),
  });
  const checkoutOk = checkout.response.status === 401 || checkout.response.status === 400 || checkout.response.status === 503;
  recordCheck(
    results,
    {
      id: "checkout-pending-path",
      ok: checkoutOk,
      detail: `HTTP ${checkout.response.status} (unauthenticated checkout must fail closed)`,
    },
    log,
  );

  const hard = hardFailureIds(results);
  log("");
  log(`Summary: ${results.filter((r) => r.ok).length}/${results.length} checks green`);
  return { ok: hard.length === 0, exitCode: hard.length === 0 ? 0 : 1, results };
}

async function main() {
  const outcome = await runProductionSmoke({
    baseUrl: process.env.BASE_URL || "",
    adminEmail:
      process.env.ADMIN_EMAIL ||
      process.env.BOOTSTRAP_ADMIN_EMAIL ||
      process.env.SMOKE_ADMIN_EMAIL ||
      "",
    adminPassword:
      process.env.ADMIN_PASSWORD ||
      process.env.BOOTSTRAP_ADMIN_PASSWORD ||
      process.env.SMOKE_ADMIN_PASSWORD ||
      "",
    bypass: process.env.VERCEL_PROTECTION_BYPASS || "",
  });
  if (outcome.error) {
    console.error(outcome.error);
  }
  process.exit(outcome.exitCode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
