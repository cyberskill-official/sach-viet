import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "src/lib/vietnamese-search-core.mjs"), "utf8");
for (const required of [
  "normalizeVietnameseText",
  "createLocalVietnameseSearchBackend",
  "createMeilisearchSearchBackend",
  "resolveSearchBackend",
  "searchPublicProducts",
  "suggestCatalogQueries",
  "search_logs",
  "local",
  "meilisearch",
  "MEILI_HOST",
]) {
  if (!source.includes(required)) throw new Error(`Vietnamese search core is missing ${required}.`);
}
if (/Algolia|Typesense|@algolia|elasticsearch\.cloud|elastic\.co/i.test(source)) {
  throw new Error("Vietnamese search must not lock a paid search SaaS SDK.");
}
if (/fetch\(|http\.request|net\.connect|WebSocket/.test(source)) {
  throw new Error("Vietnamese search core must not open network sockets by default.");
}
const catalogCore = readFileSync(resolve(root, "src/lib/catalog-core.mjs"), "utf8");
if (/searchPublicProducts|Meilisearch|Algolia/.test(catalogCore)) {
  throw new Error("Catalog core must not embed search backend implementation.");
}
const listHttp = readFileSync(resolve(root, "src/lib/catalog-http.mjs"), "utf8");
if (!listHttp.includes("searchPublicProducts") || !listHttp.includes('get("q")')) {
  throw new Error("Catalog products HTTP must wire optional q through searchPublicProducts.");
}
if (!listHttp.includes("suggestCatalogQueries")) {
  throw new Error("Suggestions HTTP must use suggestCatalogQueries.");
}
console.info(JSON.stringify({ event: "vietnamese_search_core_verified", task_id: "TASK-REBUILD-020", result: "passed" }));
