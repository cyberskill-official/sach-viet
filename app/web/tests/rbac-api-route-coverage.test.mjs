import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { requiresApiAuth } from "../src/lib/access.mjs";

const root = resolve(import.meta.dirname, "..");
const apiRoot = join(root, "src/app/api");
const libRoot = join(root, "src/lib");

const AUTH_PATTERN = /requireApiPermission|requirePermission/;

/** Routes that intentionally skip matrix checks in the handler (public auth flows). */
const EXEMPT_ROUTE_SUFFIXES = [
  "/auth/register/route.ts",
  "/auth/login/route.ts",
  "/auth/forgot/route.ts",
  "/auth/reset/route.ts",
  "/auth/verify/route.ts",
  "/auth/logout/route.ts",
];

function findRouteFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) findRouteFiles(path, acc);
    else if (name === "route.ts") acc.push(path);
  }
  return acc;
}

function apiPathFromRouteFile(filePath) {
  const rel = filePath.replace(apiRoot, "").replace(/\/route\.ts$/, "");
  return `/api${rel}`;
}

function hasAuthEnforcement(source, visited = new Set()) {
  if (AUTH_PATTERN.test(source)) return true;
  const importMatch = source.match(/from ["']@\/lib\/([\w-]+-http)\.mjs["']/g);
  if (!importMatch) return false;
  for (const line of importMatch) {
    const mod = line.match(/([\w-]+-http)\.mjs/)?.[1];
    if (!mod || visited.has(mod)) continue;
    visited.add(mod);
    const httpPath = join(libRoot, `${mod}.mjs`);
    if (!statSync(httpPath).isFile()) continue;
    const httpSource = readFileSync(httpPath, "utf8");
    if (hasAuthEnforcement(httpSource, visited)) return true;
  }
  return false;
}

test("protected API route handlers enforce matrix permissions", () => {
  const missing = [];
  for (const file of findRouteFiles(apiRoot)) {
    if (EXEMPT_ROUTE_SUFFIXES.some((suffix) => file.endsWith(suffix))) continue;
    const apiPath = apiPathFromRouteFile(file);
    if (!requiresApiAuth(apiPath)) continue;
    const source = readFileSync(file, "utf8");
    if (!hasAuthEnforcement(source)) missing.push(apiPath);
  }
  assert.deepEqual(missing, [], `Missing auth enforcement: ${missing.join(", ")}`);
});

test("paypal return route uses matrix auth and redirects unauthenticated buyers", () => {
  const source = readFileSync(
    resolve(root, "src/app/api/checkout/paypal/return/route.ts"),
    "utf8",
  );
  assert.match(source, /requireApiPermission/);
  assert.match(source, /NextResponse\.redirect\(login\)/);
  assert.doesNotMatch(source, /COOKIE_NAME/);
});
