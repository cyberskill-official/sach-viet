import { handleListPublicProducts } from "@/lib/catalog-http.mjs";

/** Thin alias for clients that call `/api/catalog/search` (same as products list + `q`). */
export async function GET(request: Request) {
  return handleListPublicProducts(request);
}
