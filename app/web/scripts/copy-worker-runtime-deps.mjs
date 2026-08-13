#!/usr/bin/env node
/**
 * Copy `pg` (and transitive deps) into a target node_modules.
 * Used by the Docker runner image so the async pool can resolve imports
 * when Next standalone tracing omits them.
 *
 * Usage: node scripts/copy-worker-runtime-deps.mjs <sourceNodeModules> <destNodeModules>
 */
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const sourceNm = process.argv[2];
const destNm = process.argv[3];

if (!sourceNm || !destNm) {
  console.error(
    "Usage: node scripts/copy-worker-runtime-deps.mjs <sourceNodeModules> <destNodeModules>",
  );
  process.exit(1);
}

function pkgDir(nm, name) {
  return name.startsWith("@")
    ? join(nm, ...name.split("/"))
    : join(nm, name);
}

function readPkg(nm, name) {
  const dir = pkgDir(nm, name);
  const path = join(dir, "package.json");
  if (!existsSync(path)) return null;
  return { dir, pkg: JSON.parse(readFileSync(path, "utf8")) };
}

const needed = new Set();
function add(name) {
  if (needed.has(name)) return;
  const info = readPkg(sourceNm, name);
  if (!info) {
    console.error(`Missing package in source node_modules: ${name}`);
    process.exit(1);
  }
  needed.add(name);
  for (const dep of Object.keys(info.pkg.dependencies || {})) add(dep);
}

add("pg");
// Optional peer used by pg in some environments; ship if present.
if (readPkg(sourceNm, "pg-cloudflare")) add("pg-cloudflare");

mkdirSync(destNm, { recursive: true });
for (const name of [...needed].sort()) {
  const from = pkgDir(sourceNm, name);
  const to = pkgDir(destNm, name);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`copied ${name}`);
}
console.log(`worker runtime deps: ${needed.size} packages → ${destNm}`);
