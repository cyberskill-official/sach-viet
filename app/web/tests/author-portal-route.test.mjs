import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("author routes use signed sessions and domain operations", async () => {
  const dashboard = readFileSync(resolve(root, "src/app/api/author/dashboard/route.ts"), "utf8");
  const requests = readFileSync(resolve(root, "src/app/api/author/manuscript-requests/route.ts"), "utf8");
  const detail = readFileSync(resolve(root, "src/app/api/author/manuscript-requests/[id]/route.ts"), "utf8");
  const withdraw = readFileSync(
    resolve(root, "src/app/api/author/manuscript-requests/[id]/withdraw/route.ts"),
    "utf8",
  );
  for (const source of [dashboard, requests, detail, withdraw]) assert.match(source, /readSession/);
  assert.match(dashboard, /getAuthorDashboard/);
  assert.match(requests, /createAuthorManuscriptRequest/);
  assert.match(requests, /listAuthorManuscriptRequests/);
  assert.match(detail, /getAuthorManuscriptRequest/);
  assert.match(withdraw, /withdrawAuthorManuscriptRequest/);
});

test("author core encodes activation gate and forbids invented settlement math", async () => {
  const core = readFileSync(resolve(root, "src/lib/author-portal-core.mjs"), "utf8");
  assert.match(core, /assertRoyaltyActivationGate/);
  assert.match(core, /policyPending/);
  assert.match(core, /author_manuscript_requests/);
  assert.match(core, /author_manuscript_request_logs/);
  assert.doesNotMatch(core, /0\.15|15%|commissionRate|defaultRoyalty/);
  assert.doesNotMatch(core, /STRIPE_/);
  assert.doesNotMatch(core, /'under_review'|"under_review"|'accepted'|"accepted"|'rejected'|"rejected"/);
});
