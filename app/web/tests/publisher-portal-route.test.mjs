import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("publisher routes use signed sessions and domain operations", async () => {
  const dashboard = readFileSync(resolve(root, "src/app/api/publisher/dashboard/route.ts"), "utf8");
  const requests = readFileSync(resolve(root, "src/app/api/publisher/publishing-requests/route.ts"), "utf8");
  const withdraw = readFileSync(
    resolve(root, "src/app/api/publisher/publishing-requests/[id]/withdraw/route.ts"),
    "utf8",
  );
  const marc = readFileSync(resolve(root, "src/app/api/publisher/marc/route.ts"), "utf8");
  for (const source of [dashboard, requests, withdraw, marc]) assert.match(source, /requireApiPermission/);
  assert.match(dashboard, /getPublisherDashboard/);
  assert.match(requests, /createPublishingRequest/);
  assert.match(requests, /listPublishingRequests/);
  assert.match(withdraw, /withdrawPublishingRequest/);
  assert.match(marc, /registerPublisherMarcRecord/);
  assert.match(marc, /listPublisherMarcRecords/);
});

test("publisher core encodes activation gate and forbids invented settlement math", async () => {
  const core = readFileSync(resolve(root, "src/lib/publisher-portal-core.mjs"), "utf8");
  assert.match(core, /assertRoyaltyActivationGate/);
  assert.match(core, /policyPending/);
  assert.match(core, /ROYALTY_DECISION_REGISTER/);
  assert.match(core, /rate_and_split/);
  assert.doesNotMatch(core, /0\.15|15%|commissionRate|defaultRoyalty/);
  assert.doesNotMatch(core, /STRIPE_/);
});
