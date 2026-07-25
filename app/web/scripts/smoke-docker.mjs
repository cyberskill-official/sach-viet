#!/usr/bin/env node
/**
 * Docker acceptance smoke (Wave 4).
 *
 * Automates safe local checks against a running Compose stack
 * (http://127.0.0.1:3000 by default). Prints MANUAL steps for
 * seed hygiene, Stripe webhook/outbox, AI playground with a real key,
 * backup_verified drill, and quality/CI.
 *
 * Usage (from app/web, stack up + seeded):
 *   npm run smoke:docker
 *   BASE_URL=http://127.0.0.1:3000 SEED_PASSWORD='…' npm run smoke:docker
 *
 * Exit 0 only when automated checks pass. Manual items are never auto-greened.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const COOKIE_NAME = "sv_session";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "admin.seed@sachviet.test";
const CUSTOMER_EMAIL = process.env.SMOKE_CUSTOMER_EMAIL || "khach-hang.seed@sachviet.test";

/** @typedef {{ ok: boolean, id: string, detail?: string, automated: boolean }} SmokeCheck */

/** @type {SmokeCheck[]} */
const results = [];

function record(id, ok, detail, automated = true) {
  results.push({ id, ok, detail, automated });
  const mark = ok ? "PASS" : automated ? "FAIL" : "MANUAL";
  const suffix = detail ? ` — ${detail}` : "";
  console.log(`[${mark}] ${id}${suffix}`);
}

function resolveSeedPassword() {
  if (process.env.SEED_PASSWORD) return process.env.SEED_PASSWORD;
  const path = join(ROOT, ".seed-password");
  if (existsSync(path)) {
    return readFileSync(path, "utf8").trim();
  }
  return null;
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

async function fetchJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { _raw: text.slice(0, 200) };
  }
  return { response, body, text };
}

async function login(email, password) {
  const { response, body } = await fetchJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const cookie = cookieFromSetCookie(response.headers);
  return { response, body, cookie };
}

async function runAutomated() {
  // 1. Health → Postgres
  try {
    const { response, body } = await fetchJson("/api/health");
    const ok = response.status === 200 && body?.ok === true && body?.db === "ok";
    record(
      "1-health-postgres",
      ok,
      ok ? `HTTP ${response.status} db=${body.db}` : `HTTP ${response.status} body=${JSON.stringify(body)}`,
    );
  } catch (error) {
    record("1-health-postgres", false, error instanceof Error ? error.message : String(error));
    return;
  }

  const password = resolveSeedPassword();
  if (!password) {
    record(
      "3-login-accounts",
      false,
      "Set SEED_PASSWORD or create app/web/.seed-password (run Compose seed first)",
    );
  } else {
    // 3. Login admin + customer
    const admin = await login(ADMIN_EMAIL, password);
    const adminOk =
      admin.response.status === 200 &&
      admin.body?.user?.role === "admin" &&
      Boolean(admin.cookie);
    record(
      "3a-login-admin",
      adminOk,
      adminOk ? ADMIN_EMAIL : `HTTP ${admin.response.status} ${admin.body?.error || ""}`.trim(),
    );

    const customer = await login(CUSTOMER_EMAIL, password);
    const customerOk =
      customer.response.status === 200 &&
      customer.body?.user?.role === "customer" &&
      Boolean(customer.cookie);
    record(
      "3b-login-customer",
      customerOk,
      customerOk ? CUSTOMER_EMAIL : `HTTP ${customer.response.status} ${customer.body?.error || ""}`.trim(),
    );

    // 4. Catalog search + suggestions
    const search = await fetchJson("/api/catalog/products?q=hoang%20tu%20be");
    const products = Array.isArray(search.body?.products) ? search.body.products : [];
    const searchOk =
      search.response.status === 200 &&
      products.length > 0 &&
      String(products[0]?.slug || "").includes("hoang-tu-be");
    record(
      "4a-catalog-search",
      searchOk,
      searchOk
        ? `top=${products[0].slug}`
        : `HTTP ${search.response.status} count=${products.length}`,
    );

    const suggestions = await fetchJson("/api/catalog/search/suggestions?q=hoang");
    const suggestionList = Array.isArray(suggestions.body?.suggestions)
      ? suggestions.body.suggestions
      : [];
    const suggestionsOk = suggestions.response.status === 200 && suggestionList.length > 0;
    record(
      "4b-catalog-suggestions",
      suggestionsOk,
      suggestionsOk
        ? `count=${suggestionList.length}`
        : `HTTP ${suggestions.response.status}`,
    );

    const cartPage = await fetch(`${BASE_URL}/ecom/cart`);
    record("4c-cart-page", cartPage.status === 200, `HTTP ${cartPage.status}`);

    // 5. Cart → checkout pending path (Stripe unset → pending order + 400)
    if (customerOk && customer.cookie) {
      let offerId = products.find((p) => p?.primaryOffer?.id)?.primaryOffer?.id;
      if (!offerId) {
        const catalog = await fetchJson("/api/catalog/products");
        const all = Array.isArray(catalog.body?.products) ? catalog.body.products : [];
        offerId = all.find((p) => p?.primaryOffer?.id)?.primaryOffer?.id;
      }
      if (!offerId) {
        record("5-checkout-pending", false, "No primaryOffer.id in catalog (seed missing?)");
      } else {
        const checkout = await fetchJson("/api/checkout", {
          method: "POST",
          headers: { cookie: customer.cookie },
          body: JSON.stringify({
            items: [{ vendorOfferId: offerId, title: "Smoke checkout", quantity: 1 }],
          }),
        });
        const stripeUnset =
          checkout.response.status === 400 &&
          /stripe checkout is not configured/i.test(String(checkout.body?.error || ""));
        const orders = await fetchJson("/api/orders", {
          headers: { cookie: customer.cookie },
        });
        const orderList = Array.isArray(orders.body?.orders) ? orders.body.orders : [];
        const hasPending = orderList.some((o) => o?.status === "pending_payment");
        const ok = stripeUnset && hasPending;
        record(
          "5-checkout-pending",
          ok,
          ok
            ? "pending_payment created; Stripe unset → 400"
            : `checkout=${checkout.response.status} pending=${hasPending} err=${checkout.body?.error || ""}`,
        );
      }
    } else {
      record("5-checkout-pending", false, "Skipped (customer login failed)");
    }

    // 7. Admin AI BYOK — fail-closed without key is acceptable; 401/403/500 are not
    if (adminOk && admin.cookie) {
      const settings = await fetchJson("/api/admin/ai-settings", {
        headers: { cookie: admin.cookie },
      });
      const settingsOk = settings.response.status === 200 && settings.body?.settings;
      record(
        "7a-admin-ai-settings",
        settingsOk,
        settingsOk
          ? `configured=${Boolean(settings.body.settings.hasApiKey)}`
          : `HTTP ${settings.response.status} ${settings.body?.error || ""}`.trim(),
      );

      const chat = await fetchJson("/api/admin/ai/chat", {
        method: "POST",
        headers: { cookie: admin.cookie },
        body: JSON.stringify({ message: "ping" }),
      });
      const chatOk =
        chat.response.status === 200 ||
        (chat.response.status === 400 &&
          /not configured|AI_SETTINGS_SECRET|required|API key/i.test(String(chat.body?.error || "")));
      record(
        "7b-admin-ai-chat-failclosed",
        chatOk,
        chatOk
          ? `HTTP ${chat.response.status}${chat.body?.reply ? " reply" : ` ${chat.body?.error || ""}`}`
          : `HTTP ${chat.response.status} ${chat.body?.error || ""}`.trim(),
      );
    } else {
      record("7a-admin-ai-settings", false, "Skipped (admin login failed)");
      record("7b-admin-ai-chat-failclosed", false, "Skipped (admin login failed)");
    }
  }
}

function printManual() {
  console.log("");
  console.log("=== MANUAL (not auto-greened) ===");
  console.log(
    [
      "2-seed-hygiene: Re-run `SEED_PASSWORD=… docker compose --profile seed run --rm seed` from app/;",
      "  confirm idempotent and that default logs do not print the password (read .seed-password instead).",
      "6-stripe-webhook-outbox: With Stripe test keys + CLI forwarding to /api/webhooks/stripe,",
      "  complete a Checkout Session → order paid → order_comms_outbox row; or stub path:",
      "  DATABASE_URL=… node scripts/drain-order-comms-outbox.mjs after a paid transition.",
      "7-admin-ai-playground: In /admin AI BYOK panel, save a free-model key and confirm a non-500 reply.",
      "8-backup-restore-drill: Record evidence in docs/ops/backup-restore-drill.md",
      "  (`backup_verified` stays unmet until an operator fills that file).",
      "9-quality-ci: From app/web: `npm run quality` with DATABASE_URL set; confirm CI green on the branch.",
    ].join("\n"),
  );
  console.log("");
  console.log("Gate rule: Vercel production deploy is FORBIDDEN until the OPERATIONS.md checklist is 100% green.");
  console.log("Vercel preview may start only after local checklist items 1–7 pass.");
  console.log("Full checklist: app/web/OPERATIONS.md § Docker acceptance checklist (Wave 4)");
}

async function main() {
  console.log(JSON.stringify({ event: "smoke_docker_start", baseUrl: BASE_URL }));
  await runAutomated();
  printManual();

  const automated = results.filter((r) => r.automated);
  const failed = automated.filter((r) => !r.ok);
  console.log(
    JSON.stringify({
      event: "smoke_docker_complete",
      result: failed.length === 0 ? "passed" : "failed",
      automatedPass: automated.filter((r) => r.ok).length,
      automatedFail: failed.length,
      failedIds: failed.map((r) => r.id),
    }),
  );
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        event: "smoke_docker_crashed",
        result: "failed",
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exitCode = 1;
  });
}

export { resolveSeedPassword, cookieFromSetCookie, main };
