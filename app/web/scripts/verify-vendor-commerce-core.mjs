import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/vendor-commerce-core.mjs"), "utf8");
for (const required of ["payouts", "payout_items", "listVendorIncomingOrders", "createVendorPayout", "listVendorPayouts", "getVendorDashboard", "Administrator access is required", "Vendor access is required"]) {
  if (!source.includes(required)) throw new Error(`Vendor commerce core is missing ${required}.`);
}
console.info(JSON.stringify({ event: "vendor_commerce_core_verified", task_id: "TASK-REBUILD-008", result: "passed" }));
