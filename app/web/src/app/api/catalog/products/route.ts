import { handleListPublicProducts } from "@/lib/catalog-http.mjs";

export async function GET(request: Request) {
  return handleListPublicProducts(request);
}
