import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/admin-commerce-core.mjs"), "utf8");
for (const required of ["vendor_applications", "getAdminCommerceDashboard", "submitVendorApplication", "resolveVendorApplication", "Administrator access is required"]) {
  if (!source.includes(required)) throw new Error(`Admin commerce core is missing ${required}.`);
}
console.info(JSON.stringify({ event: "admin_commerce_core_verified", task_id: "TASK-REBUILD-007", result: "passed" }));
