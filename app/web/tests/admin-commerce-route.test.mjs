import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("admin commerce routes use signed sessions and server-side queue operations", async () => {
  const dashboard = readFileSync(resolve(root, "src/app/api/admin/commerce/dashboard/route.ts"), "utf8");
  const applications = readFileSync(resolve(root, "src/app/api/admin/vendor-applications/route.ts"), "utf8");
  const resolution = readFileSync(resolve(root, "src/app/api/admin/vendor-applications/[id]/route.ts"), "utf8");
  const submission = readFileSync(resolve(root, "src/app/api/vendor/applications/route.ts"), "utf8");
  for (const source of [dashboard, applications, resolution, submission]) assert.match(source, /readSession/);
  assert.match(dashboard, /getAdminCommerceDashboard/);
  assert.match(applications, /listVendorApplications/);
  assert.match(resolution, /resolveVendorApplication/);
  assert.match(submission, /submitVendorApplication/);
});
