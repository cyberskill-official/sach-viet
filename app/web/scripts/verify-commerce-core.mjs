import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/commerce-core.mjs"), "utf8");
for (const required of ["CREATE TABLE IF NOT EXISTS orders", "CREATE TABLE IF NOT EXISTS order_items", "createStripeCheckoutSession", "verifyStripeSignature", "listCustomerOrders"]) {
  if (!source.includes(required)) throw new Error(`Commerce core is missing ${required}.`);
}
if (source.includes("STRIPE_SECRET_KEY=")) throw new Error("Commerce core must not contain a Stripe secret value.");
console.info(JSON.stringify({ event: "commerce_core_verified", task_id: "TASK-REBUILD-005", result: "passed" }));
