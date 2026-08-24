import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/publisher-portal-core.mjs"), "utf8");
for (const required of [
  "publishing_requests",
  "publisher_marc_records",
  "royalty_decision_acceptances",
  "createPublishingRequest",
  "listPublishingRequests",
  "withdrawPublishingRequest",
  "registerPublisherMarcRecord",
  "listPublisherMarcRecords",
  "getPublisherDashboard",
  "assertRoyaltyActivationGate",
  "policyPending",
  "ROYALTY_DECISION_REGISTER",
  "Publisher access is required",
  "requireStoredObjectKey",
  "TASK-REBUILD-017",
]) {
  if (!source.includes(required)) throw new Error(`Publisher portal core is missing ${required}.`);
}

if (source.includes("STRIPE_") || source.includes("createStripeCheckoutSession")) {
  throw new Error("Publisher portal core must not create Stripe checkout.");
}
if (/\b0\.15\b|15%|defaultRoyalty|commissionRate/.test(source)) {
  throw new Error("Publisher portal core must not invent royalty rates or splits.");
}
if (source.includes("createVendorPayout") || source.includes("FROM payouts")) {
  throw new Error("Publisher portal core must not reuse vendor payout settlement.");
}

const vendor = readFileSync(resolve(root, "src/lib/vendor-commerce-core.mjs"), "utf8");
if (vendor.includes("publishing_requests") || vendor.includes("publisher_marc_records") || vendor.includes("assertRoyaltyActivationGate")) {
  throw new Error("Vendor commerce core must remain free of publisher royalty ownership.");
}

const institution = readFileSync(resolve(root, "src/lib/institution-buyer-core.mjs"), "utf8");
if (institution.includes("publisher_marc_records") || institution.includes("publishing_requests")) {
  throw new Error("Institution buyer core must remain free of publisher portal ownership.");
}

for (const route of [
  "src/app/api/publisher/dashboard/route.ts",
  "src/app/api/publisher/publishing-requests/route.ts",
  "src/app/api/publisher/publishing-requests/[id]/withdraw/route.ts",
  "src/app/api/publisher/marc/route.ts",
]) {
  const body = readFileSync(resolve(root, route), "utf8");
  if (!body.includes("requireApiPermission") && !body.includes("requirePermission")) {
    throw new Error(`${route} must enforce matrix permissions.`);
  }
}

console.info(JSON.stringify({ event: "publisher_portal_core_verified", task_id: "TASK-REBUILD-017", result: "passed" }));
