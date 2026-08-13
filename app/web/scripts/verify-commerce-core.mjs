import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/commerce-core.mjs"), "utf8");
const migration = readFileSync(resolve(root, "migrations/001_initial_schema.sql"), "utf8");

for (const required of [
  "createStripeCheckoutSession",
  "createPayPalCheckoutOrder",
  "capturePayPalOrder",
  "verifyStripeSignature",
  "verifyPayPalWebhookSignature",
  "listCustomerOrders",
  "normalizeCheckoutProvider",
  "assertStripeTestSecret",
  "assertPayPalSandboxMode",
  "assertSandboxPaymentsOnly",
  "sandboxCheckoutStubEnabled",
  "createSandboxStubCheckout",
  "expirePendingOrders",
]) {
  if (!source.includes(required)) throw new Error(`Commerce core is missing ${required}.`);
}
for (const required of ["CREATE TABLE IF NOT EXISTS orders", "CREATE TABLE IF NOT EXISTS order_items"]) {
  if (!migration.includes(required)) throw new Error(`Commerce schema is missing ${required}.`);
}
const paymentMigration = readFileSync(resolve(root, "migrations/003_payment_provider.sql"), "utf8");
for (const required of ["payment_provider", "paypal_order_id"]) {
  if (!paymentMigration.includes(required)) throw new Error(`Payment migration is missing ${required}.`);
}
if (source.includes("STRIPE_SECRET_KEY=")) throw new Error("Commerce core must not contain a Stripe secret value.");
if (source.includes("PAYPAL_CLIENT_SECRET=")) throw new Error("Commerce core must not contain a PayPal secret value.");
console.info(JSON.stringify({ event: "commerce_core_verified", task_id: "TASK-PAYMENTS-001", result: "passed" }));
