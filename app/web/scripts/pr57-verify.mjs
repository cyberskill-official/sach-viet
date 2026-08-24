#!/usr/bin/env node
/**
 * Post-merge PR #57 production verification script.
 * Usage: node tmp/post-merge-smoke/pr57-verify.mjs
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://sachviet.cyberskill.world";
const OUT = dirname(fileURLToPath(import.meta.url));
await mkdir(OUT, { recursive: true });

/** @type {Record<string, { pass: boolean, detail: string }>} */
const results = {};

function record(id, pass, detail = "") {
  results[id] = { pass, detail };
  console.log(`[${pass ? "PASS" : "FAIL"}] ${id}${detail ? ` — ${detail}` : ""}`);
}

async function fetchJson(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = { _raw: text.slice(0, 200) }; }
  return { status: res.status, body, headers: res.headers };
}

// --- API checks ---
const ready = await fetchJson("/api/ready");
record("deploy-sha", ready.body?.release?.sha?.startsWith("15f15d5"), `sha=${ready.body?.release?.sha?.slice(0, 7)}`);

const authMe = await fetchJson("/api/auth/me");
record("guest-auth-me", authMe.status === 200 && authMe.body?.user === null, `HTTP ${authMe.status}`);

const search = await fetchJson("/api/catalog/search?q=Kieu");
record("catalog-search-alias", search.status === 200, `HTTP ${search.status}`);

const health = await fetchJson("/api/health");
record("health", health.status === 200 && health.body?.ok === true, `HTTP ${health.status}`);

// Find 1-result query
const queries = ["Truyện Kiều", "Kiều", "Tuổi Thơ", "Mắt Biếc", "Hoàng Tử"];
let oneHitQuery = null;
for (const q of queries) {
  const { status, body } = await fetchJson(`/api/catalog/products?q=${encodeURIComponent(q)}`);
  const items = body?.items || body?.products || [];
  if (status === 200 && items.length === 1) {
    oneHitQuery = q;
    break;
  }
}
record("bug15-query-found", Boolean(oneHitQuery), oneHitQuery || "no 1-hit query");

const browser = await chromium.launch({ headless: true });
const contexts = {
  mobile: await browser.newContext({ viewport: { width: 375, height: 812 } }),
  desktop: await browser.newContext({ viewport: { width: 1280, height: 900 } }),
};

/** @type {string[]} */
const consoleErrors = [];

for (const [label, ctx] of Object.entries(contexts)) {
  const page = await ctx.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[${label}] ${msg.text()}`);
  });

  // BUG-01 mobile header
  if (label === "mobile") {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    // Dismiss auto-start tour overlay so it does not block interactions
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    const closeBtn = page.locator(".driver-popover-close-btn");
    if (await closeBtn.count()) await closeBtn.first().click();
    await page.waitForTimeout(400);

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    const chromeLogin = await page.evaluate(() => {
      const nav = document.querySelector('[data-tour="storefront-nav"]');
      if (!nav) return 0;
      return [...nav.querySelectorAll(':scope > a[href="/login"]')].filter((a) => {
        const cs = getComputedStyle(a);
        return cs.display !== "none" && cs.visibility !== "hidden";
      }).length;
    });
    record("bug01-no-overflow", metrics.scrollWidth <= metrics.clientWidth + 1, `scrollWidth=${metrics.scrollWidth} clientWidth=${metrics.clientWidth}`);
    record("bug01-login-not-inline", chromeLogin === 0, `visible chrome login links=${chromeLogin}`);

    await page.locator('button[aria-haspopup="menu"]').first().click({ force: true });
    await page.waitForTimeout(300);
    const menuLogin = await page.locator('#storefront-more-menu a[href="/login"], [role="menu"] a[href="/login"]').first().isVisible();
    record("bug01-login-in-menu", menuLogin, "menu login visible after hamburger open");
    await page.screenshot({ path: resolve(OUT, "mobile-header-375-pr57.png"), fullPage: false });

    // LuxuryShell pages
    for (const path of ["/membership", "/login"]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      const m = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
      record(`bug01-luxury-${path}`, m, path);
    }
  }

  // BUG-15 singular shelf
  if (oneHitQuery) {
    const lang = label === "mobile" ? "vi" : "en";
    const langParam = lang === "vi" ? "?lang=vi" : "";
    await page.goto(`${BASE}/${langParam}`, { waitUntil: "networkidle" });
    const searchInput = page.locator('input[type="search"], input[name="q"], [data-tour="storefront-search"] input').first();
    await searchInput.fill(oneHitQuery);
    await page.locator('form[data-tour="storefront-search"]').first().evaluate((f) => f.requestSubmit());
    await page.waitForFunction(() => {
      const el = document.querySelector('[aria-live="polite"]');
      const text = el?.textContent || "";
      return text.length > 0 && !/warming|chuẩn bị/i.test(text);
    }, { timeout: 15000 });
    const badge = await page.locator('[aria-live="polite"]').first().textContent();
    const expectedEn = "1 title on the shelf";
    const expectedVi = "1 đầu sách trên kệ";
    const expected = lang === "vi" ? expectedVi : expectedEn;
    const badgeText = (badge || "").trim();
    const cards = await page.locator('a[href^="/products/"]').count();
    const pass = badgeText === expected && cards >= 1;
    record(`bug15-singular-${label}-${lang}`, pass, `badge="${badgeText}" cards=${cards} expected="${expected}"`);
  }

  // Guest portal redirects
  const portals = ["admin", "vendor", "employee", "retail", "b2b", "institution", "publisher", "author", "supplier"];
  for (const portal of portals) {
    const resp = await page.goto(`${BASE}/${portal}`, { waitUntil: "networkidle" });
    const url = page.url();
    const ok = portal === "supplier"
      ? url.includes("/gone/supplier") || url.includes("/login")
      : url.includes("/login") || url.includes("/forbidden");
    if (label === "desktop") record(`portal-guest-${portal}`, ok, url);
  }

  // Key pages console (desktop)
  if (label === "desktop") {
    for (const path of ["/", "/login", "/ecom/cart", "/membership", "/features"]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    }
    record("console-errors-guest", consoleErrors.length === 0, consoleErrors.slice(0, 5).join("; ") || "none");
  }

  await page.close();
}

await browser.close();

// Write JSON report
const summary = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE,
  releaseSha: ready.body?.release?.sha,
  oneHitQuery,
  consoleErrors,
  results,
  passCount: Object.values(results).filter((r) => r.pass).length,
  failCount: Object.values(results).filter((r) => !r.pass).length,
};
await writeFile(resolve(OUT, "pr57-results.json"), JSON.stringify(summary, null, 2));
console.log("\nSummary:", summary.passCount, "pass,", summary.failCount, "fail");
process.exit(summary.failCount > 0 ? 1 : 0);
