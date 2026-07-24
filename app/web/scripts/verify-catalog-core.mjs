import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/catalog-core.mjs"), "utf8");
const productsSchema = source.match(/CREATE TABLE IF NOT EXISTS products \(([\s\S]*?)\) STRICT;/)?.[1] ?? "";

if (!source.includes("CREATE TABLE IF NOT EXISTS vendor_offers")) throw new Error("Vendor offers schema is missing.");
if (/price|stock/i.test(productsSchema)) throw new Error("Product schema must not contain price or stock columns.");
if (!source.includes("selectPrimaryOffer")) throw new Error("Primary offer selection is missing.");
if (!source.includes("canAccessOwnedRecord")) throw new Error("Vendor offer ownership enforcement is missing.");
console.info(JSON.stringify({ event: "catalog_core_verified", task_id: "TASK-REBUILD-004", result: "passed" }));
