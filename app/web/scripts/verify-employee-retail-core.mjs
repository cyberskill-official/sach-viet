import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/employee-retail-core.mjs"), "utf8");
for (const required of [
  "home_sections",
  "getEmployeeDashboard",
  "listHomeSections",
  "upsertHomeSection",
  "listRetailOrders",
  "Employee access is required",
  "Retail access is required",
]) {
  if (!source.includes(required)) throw new Error(`Employee retail core is missing ${required}.`);
}
console.info(JSON.stringify({ event: "employee_retail_core_verified", task_id: "TASK-REBUILD-009", result: "passed" }));
