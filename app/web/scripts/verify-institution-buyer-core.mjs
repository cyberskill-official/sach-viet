import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/institution-buyer-core.mjs"), "utf8");
for (const required of [
  "institution_budgets",
  "institution_marc_records",
  "upsertInstitutionBudget",
  "getInstitutionBudget",
  "submitInstitutionPurchaseOrder",
  "registerInstitutionMarcRecord",
  "listInstitutionMarcRecords",
  "getInstitutionMarcRecord",
  "awaiting_po",
  "purchase_order",
  "confirmed",
  "public URL",
  "Institution access is required",
  "B2B staff access is required",
  "TASK-REBUILD-015",
]) {
  if (!source.includes(required)) throw new Error(`Institution buyer core is missing ${required}.`);
}
if (source.includes("STRIPE_") || source.includes("createStripeCheckoutSession")) {
  throw new Error("Institution buyer core must not create Stripe checkout.");
}
if (source.includes("transitionOrderStatus") || source.includes("convertWonQuoteToOrder")) {
  throw new Error("Institution buyer core must not own order conversion or status transitions.");
}

const quoteCore = readFileSync(resolve(root, "src/lib/b2b-quote-core.mjs"), "utf8");
if (quoteCore.includes("institution_budgets") || quoteCore.includes("institution_marc_records") || quoteCore.includes("submitInstitutionPurchaseOrder")) {
  throw new Error("B2B quote core must remain free of institution buyer ownership.");
}

const orderCore = readFileSync(resolve(root, "src/lib/b2b-order-core.mjs"), "utf8");
if (orderCore.includes("institution_budgets") || orderCore.includes("institution_marc_records") || orderCore.includes("submitInstitutionPurchaseOrder")) {
  throw new Error("B2B order core must remain free of institution buyer ownership.");
}

const blindOrder = readFileSync(resolve(root, "src/app/api/institution/orders/[id]/route.ts"), "utf8");
if (!blindOrder.includes("getInstitutionOrder") || blindOrder.includes("submitInstitutionPurchaseOrder")) {
  throw new Error("Institution order blind-read handler must remain intact.");
}

console.info(JSON.stringify({ event: "institution_buyer_core_verified", task_id: "TASK-REBUILD-015", result: "passed" }));
