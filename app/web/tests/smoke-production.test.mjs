import assert from "node:assert/strict";
import test from "node:test";
import {
  baseHeaders,
  cookieFromSetCookie,
  hardFailureIds,
  runProductionSmoke,
} from "../scripts/smoke-production.mjs";

function jsonResponse(status, body, headerInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headerInit },
  });
}

test("cookieFromSetCookie reads sv_session from set-cookie", () => {
  const headers = new Headers({ "set-cookie": "sv_session=abc123; Path=/; HttpOnly" });
  assert.equal(cookieFromSetCookie(headers), "sv_session=abc123");
});

test("baseHeaders includes protection bypass when set", () => {
  assert.deepEqual(baseHeaders({ bypass: "secret" })["x-vercel-protection-bypass"], "secret");
  assert.equal(baseHeaders({}).hasOwnProperty("x-vercel-protection-bypass"), false);
});

test("hardFailureIds ignores soft admin-login skip", () => {
  assert.deepEqual(
    hardFailureIds([
      { id: "health-postgres", ok: true },
      { id: "catalog-list", ok: true },
      { id: "admin-login", ok: false },
    ]),
    [],
  );
  assert.deepEqual(hardFailureIds([{ id: "health-postgres", ok: false }]), ["health-postgres"]);
});

test("runProductionSmoke requires BASE_URL", async () => {
  const outcome = await runProductionSmoke({ baseUrl: "", log: () => {} });
  assert.equal(outcome.exitCode, 2);
  assert.match(outcome.error || "", /BASE_URL/);
});

test("runProductionSmoke passes health + empty catalog without admin creds", async () => {
  /** @type {string[]} */
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(String(url));
    if (String(url).endsWith("/api/health")) {
      return jsonResponse(200, { ok: true, db: "ok" });
    }
    if (String(url).includes("/api/catalog/products")) {
      return jsonResponse(200, { products: [] });
    }
    return jsonResponse(404, { error: "missing" });
  };

  const outcome = await runProductionSmoke({
    baseUrl: "https://example.test",
    fetchImpl,
    log: () => {},
  });

  assert.equal(outcome.ok, true);
  assert.equal(outcome.exitCode, 0);
  assert.ok(outcome.results.some((r) => r.id === "health-postgres" && r.ok));
  assert.ok(outcome.results.some((r) => r.id === "catalog-list" && r.ok));
  assert.ok(outcome.results.some((r) => r.id === "admin-login" && !r.ok && /Skipped/.test(r.detail || "")));
  assert.ok(outcome.results.some((r) => r.id === "checkout-pending-path" && r.ok));
  assert.ok(urls.some((u) => u.includes("/api/health")));
});

test("runProductionSmoke fails closed when health is not ok", async () => {
  const fetchImpl = async () => jsonResponse(200, { ok: false, db: "down" });
  const outcome = await runProductionSmoke({
    baseUrl: "https://example.test",
    fetchImpl,
    log: () => {},
  });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.exitCode, 1);
  assert.ok(outcome.results.some((r) => r.id === "health-postgres" && !r.ok));
});

test("runProductionSmoke verifies admin login when credentials provided", async () => {
  const fetchImpl = async (url, init = {}) => {
    if (String(url).endsWith("/api/health")) {
      return jsonResponse(200, { ok: true, db: "ok" });
    }
    if (String(url).includes("/api/catalog/products")) {
      return jsonResponse(200, { products: [{ slug: "demo" }] });
    }
    if (String(url).endsWith("/api/auth/login")) {
      assert.equal(init.method, "POST");
      return jsonResponse(200, { user: { role: "admin" } }, { "set-cookie": "sv_session=tok; Path=/" });
    }
    if (String(url).endsWith("/api/auth/me")) {
      assert.match(String(init.headers?.cookie || ""), /sv_session=tok/);
      return jsonResponse(200, { user: { role: "admin" } });
    }
    return jsonResponse(404, {});
  };

  const outcome = await runProductionSmoke({
    baseUrl: "https://example.test",
    fetchImpl,
    adminEmail: "admin@example.test",
    adminPassword: "secret",
    log: () => {},
  });

  assert.equal(outcome.ok, true);
  assert.ok(outcome.results.some((r) => r.id === "admin-login" && r.ok));
  assert.ok(outcome.results.some((r) => r.id === "admin-session" && r.ok));
});
