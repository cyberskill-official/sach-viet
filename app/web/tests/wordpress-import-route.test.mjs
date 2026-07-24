import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("wordpress import admin routes exist and gate through session + core helpers", () => {
  const statusRoute = readFileSync(resolve(root, "src/app/api/admin/wordpress-import/status/route.ts"), "utf8");
  const applyRoute = readFileSync(resolve(root, "src/app/api/admin/wordpress-import/apply/route.ts"), "utf8");
  assert.match(statusRoute, /getWordpressImportStatus/);
  assert.match(statusRoute, /readSession/);
  assert.match(applyRoute, /applyWordpressImportAsAdmin/);
  assert.match(applyRoute, /readSession/);
});
