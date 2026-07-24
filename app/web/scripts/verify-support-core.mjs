import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/support-core.mjs"), "utf8");
for (const required of ["support_tickets", "ticket_messages", "goods_requests", "product_reviews", "listTicketMessages", "createGoodsRequest", "verified_purchase"]) {
  if (!source.includes(required)) throw new Error(`Support core is missing ${required}.`);
}
console.info(JSON.stringify({ event: "support_core_verified", task_id: "TASK-REBUILD-006", result: "passed" }));
