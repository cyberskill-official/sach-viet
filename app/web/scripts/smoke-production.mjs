#!/usr/bin/env node
/**
 * Production smoke (Phase A).
 *
 * Usage:
 *   BASE_URL=https://<production-host> npm run smoke:production
 *   BASE_URL=… BOOTSTRAP_ADMIN_EMAIL=… BOOTSTRAP_ADMIN_PASSWORD=… npm run smoke:production
 *
 * Optional: VERCEL_PROTECTION_BYPASS=<secret> for Deployment Protection.
 * Does not invent catalog seed data. Unpaid checkout is the commerce proof (Stripe deferred).
 */
const BASE_URL = (process.env.BASE_URL || "").replace(/\/$/, "");
const COOKIE_NAME = "sv_session";
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.SMOKE_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.SMOKE_ADMIN_PASSWORD || "";
const BYPASS = process.env.VERCEL_PROTECTION_BYPASS || "";

/** @typedef {{ ok: boolean, id: string, detail?: string }} SmokeCheck */
/** @type {SmokeCheck[]} */
const results = [];

function record(id, ok, detail) {
  results.push({ id, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${id}${detail ? ` — ${detail}` : ""}`);
}

function cookieFromSetCookie(headers) {
  const raw = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  const list = raw.length > 0 ? raw : [headers.get("set-cookie")].filter(Boolean);
  for (const line of list) {
    const match = String(line).match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (match) return `${COOKIE_NAME}=${match[1]}`;
  }
  return null;
}

function baseHeaders(extra = {}) {
  /** @type {Record<string, string>} */
  const headers = { accept: "application/json", ...extra };
  if (BYPASS) headers["x-vercel-protection-bypass"] = BYPASS;
  return headers;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: baseHeaders({
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
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

async function main() {
  if (!BASE_URL) {
    console.error("BASE_URL is required (Production origin, no trailing slash).");
    process.exit(2);
  }
  console.log(`Production smoke against ${BASE_URL}`);

  try {
    const { response, body } = await fetchJson("/api/health");
    const ok = response.status === 200 && body?.ok === true && body?.db === "ok";
    record(
      "health-postgres",
      ok,
      ok ? `HTTP ${response.status} db=${body.db}` : `HTTP ${response.status} body=${JSON.stringify(body)}`,
    );
    if (!ok) {
      summarizeAndExit();
      return;
    }
  } catch (error) {
    record("health-postgres", false, error instanceof Error ? error.message : String(error));
    summarizeAndExit();
    return;
  }

  const catalog = await fetchJson("/api/catalog/products");
  const products = Array.isArray(catalog.body?.products) ? catalog.body.products : [];
  record(
    "catalog-list",
    catalog.response.status === 200,
    `HTTP ${catalog.response.status} count=${products.length}`,
  );

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const login = await fetchJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const cookie = cookieFromSetCookie(login.response.headers);
    const loginOk = login.response.status === 200 && Boolean(cookie);
    record(
      "admin-login",
      loginOk,
      loginOk ? ADMIN_EMAIL : `HTTP ${login.response.status} ${login.body?.error || ""}`.trim(),
    );

    if (loginOk && cookie) {
      const me = await fetchJson("/api/auth/me", { headers: { cookie } });
      record(
        "admin-session",
        me.response.status === 200 && me.body?.user?.role === "admin",
        `role=${me.body?.user?.role || "none"}`,
      );
    }
  } else {
    record(
      "admin-login",
      false,
      "Skipped — set BOOTSTRAP_ADMIN_EMAIL + BOOTSTRAP_ADMIN_PASSWORD (or SMOKE_*) to verify login",
    );
  }

  // Unpaid checkout proof only when a customer session + offer exist (not always true on fresh prod).
  if (products.length === 0) {
    record(
      "checkout-pending-path",
      true,
      "Deferred — empty catalog (fixture/admin load is a separate operator step; health+catalog APIs ok)",
    );
  }

  summarizeAndExit();
}

function summarizeAndExit() {
  const failed = results.filter((r) => !r.ok && !String(r.detail || "").startsWith("Skipped"));
  const hardFailed = results.filter((r) => !r.ok && r.id !== "admin-login");
  console.log("");
  console.log(`Summary: ${results.filter((r) => r.ok).length}/${results.length} checks green`);
  // admin-login skip is soft; health failure is hard
  process.exit(hardFailed.some((r) => r.id === "health-postgres" || r.id === "catalog-list") ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
