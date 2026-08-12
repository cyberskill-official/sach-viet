import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/author-portal-core.mjs"), "utf8");
const migration = readFileSync(resolve(root, "migrations/001_initial_schema.sql"), "utf8");
for (const required of [
  "author_manuscript_requests",
  "author_manuscript_request_logs",
  "createAuthorManuscriptRequest",
  "listAuthorManuscriptRequests",
  "getAuthorManuscriptRequest",
  "withdrawAuthorManuscriptRequest",
  "getAuthorDashboard",
  "assertRoyaltyActivationGate",
  "policyPending",
  "Author access is required",
  "requireStoredObjectKey",
  "TASK-REBUILD-018",
]) {
  if (!source.includes(required)) throw new Error(`Author portal core is missing ${required}.`);
}
if (!migration.includes("royalty_decision_acceptances")) {
  throw new Error("Initial schema must include royalty_decision_acceptances.");
}

if (source.includes("STRIPE_") || source.includes("createStripeCheckoutSession")) {
  throw new Error("Author portal core must not create Stripe checkout.");
}
if (/\b0\.15\b|15%|defaultRoyalty|commissionRate/.test(source)) {
  throw new Error("Author portal core must not invent royalty rates or splits.");
}
if (source.includes("createVendorPayout") || source.includes("FROM payouts")) {
  throw new Error("Author portal core must not reuse vendor payout settlement.");
}
if (/'under_review'|"under_review"|'accepted'|"accepted"|'rejected'|"rejected"/.test(source)) {
  throw new Error("Author portal core must not invent multi-party review stages.");
}

const publisher = readFileSync(resolve(root, "src/lib/publisher-portal-core.mjs"), "utf8");
if (!publisher.includes("assertRoyaltyActivationGate") || !publisher.includes("publishing_requests")) {
  throw new Error("Publisher portal scaffolding must remain intact for shared activation-gate semantics.");
}
if (publisher.includes("author_manuscript_requests")) {
  throw new Error("Publisher portal core must remain free of author manuscript ownership.");
}

const vendor = readFileSync(resolve(root, "src/lib/vendor-commerce-core.mjs"), "utf8");
if (vendor.includes("author_manuscript_requests") || vendor.includes("assertRoyaltyActivationGate")) {
  throw new Error("Vendor commerce core must remain free of author earnings ownership.");
}

for (const route of [
  "src/app/api/author/dashboard/route.ts",
  "src/app/api/author/manuscript-requests/route.ts",
  "src/app/api/author/manuscript-requests/[id]/route.ts",
  "src/app/api/author/manuscript-requests/[id]/withdraw/route.ts",
]) {
  const body = readFileSync(resolve(root, route), "utf8");
  if (!body.includes("readSession")) throw new Error(`${route} must use signed sessions.`);
}

console.info(JSON.stringify({ event: "author_portal_core_verified", task_id: "TASK-REBUILD-018", result: "passed" }));
