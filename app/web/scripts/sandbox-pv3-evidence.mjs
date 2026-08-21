#!/usr/bin/env node
/**
 * Sandbox PV3 evidence helper (DEC-PV3-001 interim-owner-defaults-2026-08-21b).
 *
 * Authorizes sandbox-only complete evidence procedures. Does NOT authorize live keys,
 * live charges (including $0 live), or Vercel live secrets.
 *
 * Usage:
 *   BASE_URL=https://your-preview.example node scripts/sandbox-pv3-evidence.mjs
 *
 * Exit non-zero if live credentials are detected in the local environment.
 */
import {
  assertPayPalSandboxMode,
  assertSandboxPaymentsOnly,
  assertStripeTestSecret,
} from "../src/lib/commerce-core.mjs";

const baseUrl = (process.env.BASE_URL || process.env.EVIDENCE_BASE_URL || "").replace(/\/$/, "");

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }));
  process.exit(1);
}

try {
  assertSandboxPaymentsOnly(process.env);
  if (process.env.STRIPE_SECRET_KEY) {
    assertStripeTestSecret(process.env.STRIPE_SECRET_KEY);
  }
  assertPayPalSandboxMode(process.env);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const report = {
  ok: true,
  mode: "sandbox_only",
  dec: "DEC-PV3-001",
  version: "interim-owner-defaults-2026-08-21b",
  liveAuthorized: false,
  maxLiveTestAmount: "not_authorized",
  baseUrl: baseUrl || null,
  checks: [],
};

async function probe(path) {
  if (!baseUrl) {
    report.checks.push({ path, skipped: true, reason: "BASE_URL unset" });
    return;
  }
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, { method: "GET" });
  const body = await response.json().catch(() => null);
  report.checks.push({
    path,
    status: response.status,
    ok: response.ok,
    releaseSha: body?.release?.sha ?? body?.sha ?? null,
  });
}

await probe("/api/health");
await probe("/api/ready");

console.log(JSON.stringify(report, null, 2));
if (report.checks.some((check) => check.skipped !== true && check.ok === false)) {
  process.exit(2);
}
