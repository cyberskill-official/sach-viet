import { handleSuggestCatalogQueries } from "@/lib/catalog-http.mjs";

export async function GET(request: Request) {
  return handleSuggestCatalogQueries(request);
}
