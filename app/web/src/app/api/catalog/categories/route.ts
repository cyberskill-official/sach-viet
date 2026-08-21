import { handleListPublicCategories } from "@/lib/catalog-http.mjs";

export async function GET(request: Request) {
  return handleListPublicCategories(request);
}
