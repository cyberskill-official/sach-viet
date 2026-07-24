import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/b2b-order-core.mjs"), "utf8");
for (const required of [
  "b2b_orders",
  "b2b_order_items",
  "b2b_artifacts",
  "convertWonQuoteToOrder",
  "attachArtifact",
  "transitionOrderStatus",
  "listInstitutionOrders",
  "Only won quotes",
  "purchase_order artifact is required",
  "public URL",
  "B2B staff access is required",
  "Institution access is required",
]) {
  if (!source.includes(required)) throw new Error(`B2B order core is missing ${required}.`);
}
if (source.includes("STRIPE_") || source.includes("createStripeCheckoutSession") || source.includes("vendor_offer_id")) {
  throw new Error("B2B order core must not create Stripe checkout or vendor-offer retail lines.");
}
const quoteCore = readFileSync(resolve(root, "src/lib/b2b-quote-core.mjs"), "utf8");
if (quoteCore.includes("b2b_orders") || quoteCore.includes("b2b_artifacts") || quoteCore.includes("convertWonQuoteToOrder")) {
  throw new Error("B2B quote core must remain free of order/contract/PO ownership.");
}
console.info(JSON.stringify({ event: "b2b_order_core_verified", task_id: "TASK-REBUILD-014", result: "passed" }));
