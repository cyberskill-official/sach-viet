import { NextResponse } from "next/server";
import { createCatalogStore } from "@/lib/catalog-core.mjs";
import { searchPublicProducts } from "@/lib/vietnamese-search-core.mjs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const store = createCatalogStore();
  try {
    return NextResponse.json({ products: searchPublicProducts(store, { category, q, limit }) });
  } finally {
    store.close();
  }
}
