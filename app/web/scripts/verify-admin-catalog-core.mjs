import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const core = readFileSync(resolve(root, "src/lib/admin-catalog-core.mjs"), "utf8");
const catalog = readFileSync(resolve(root, "src/lib/catalog-core.mjs"), "utf8");
const dashboard = readFileSync(resolve(root, "src/components/admin-dashboard.tsx"), "utf8");
const operations = readFileSync(resolve(root, "OPERATIONS.md"), "utf8");
const routes = [
  "src/app/api/admin/catalog/categories/route.ts",
  "src/app/api/admin/catalog/products/route.ts",
  "src/app/api/admin/catalog/offers/route.ts",
].map((path) => readFileSync(resolve(root, path), "utf8"));

for (const required of [
  "createAdminCategory",
  "createAdminProduct",
  "writeAdminVendorOffer",
  "listAdminCategories",
  "listAdminProducts",
  "Administrator access is required",
  "createCategory",
  "createProduct",
  "writeVendorOffer",
]) {
  if (!core.includes(required)) throw new Error(`Admin catalog core is missing ${required}.`);
}

if (!catalog.includes("export async function listCategories")) throw new Error("catalog-core must export listCategories.");

for (const source of routes) {
  if (!source.includes("readSession")) throw new Error("Admin catalog routes must use readSession.");
  if (!source.includes("createAdminCatalogStore")) throw new Error("Admin catalog routes must use createAdminCatalogStore.");
}

if (!dashboard.includes("/api/admin/catalog/categories")) throw new Error("Admin dashboard must call catalog categories API.");
if (!dashboard.includes("/api/admin/catalog/products")) throw new Error("Admin dashboard must call catalog products API.");
if (!dashboard.includes("/api/admin/catalog/offers")) throw new Error("Admin dashboard must call catalog offers API.");
if (!dashboard.includes('id="catalog"')) throw new Error("Admin dashboard must render a catalog section.");

if (!operations.includes("Admin day-2 entry (recommended)")) throw new Error("OPERATIONS.md must recommend admin day-2 catalog load first.");
if (!/not recommended[\s\S]*WordPress|WordPress[\s\S]*not recommended/i.test(operations)) {
  throw new Error("OPERATIONS.md must mark WordPress fixture as not recommended for Day-2.");
}

console.info(JSON.stringify({ event: "admin_catalog_core_verified", task_id: "TASK-ADMIN-002", result: "passed" }));
