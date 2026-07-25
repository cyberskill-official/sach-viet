import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/b2b-quote-core.mjs"), "utf8");
const migration = readFileSync(resolve(root, "migrations/001_initial_schema.sql"), "utf8");

for (const required of [
  "organizations",
  "organization_members",
  "selection_lists",
  "b2b_quotes",
  "createOrganization",
  "requestQuoteFromSelectionList",
  "listQuotesPipeline",
  "transitionQuoteStatus",
  "B2B staff access is required",
  "Institution access is required",
  "Cannot transition quote",
]) {
  if (!source.includes(required)) throw new Error(`B2B quote core is missing ${required}.`);
}
// DDL for B2B tables lives in the migration, not in b2b-quote-core.mjs
for (const required of ["organizations", "b2b_quotes", "selection_lists"]) {
  if (!migration.includes(required)) throw new Error(`B2B schema migration is missing ${required}.`);
}
// b2b-quote-core.mjs must not contain commerce order or contract DDL
if (source.includes("CREATE TABLE IF NOT EXISTS orders") || source.includes("purchase_orders") || source.includes("contracts")) {
  throw new Error("B2B quote core must not create orders, contracts, or purchase orders.");
}
console.info(JSON.stringify({ event: "b2b_quote_core_verified", task_id: "TASK-REBUILD-013", result: "passed" }));
