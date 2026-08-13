#!/usr/bin/env node
/**
 * Local production server for Playwright / Docker-shaped `next start`.
 * `next start` refuses `output: "standalone"`; this runs the traced server.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standalone = resolve(root, ".next/standalone");
const server = resolve(standalone, "server.js");
if (!existsSync(server)) {
  console.error("Missing .next/standalone/server.js — run `npm run build` first.");
  process.exit(1);
}

const staticSrc = resolve(root, ".next/static");
const staticDest = resolve(standalone, ".next/static");
if (existsSync(staticSrc)) {
  if (existsSync(staticDest)) rmSync(staticDest, { recursive: true, force: true });
  mkdirSync(resolve(standalone, ".next"), { recursive: true });
  cpSync(staticSrc, staticDest, { recursive: true });
}

const publicSrc = resolve(root, "public");
const publicDest = resolve(standalone, "public");
if (existsSync(publicSrc) && !existsSync(publicDest)) {
  cpSync(publicSrc, publicDest, { recursive: true });
}

const child = spawn(process.execPath, ["server.js"], {
  cwd: standalone,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOSTNAME: process.env.HOSTNAME || "127.0.0.1",
    PORT: process.env.PORT || "3100",
  },
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
