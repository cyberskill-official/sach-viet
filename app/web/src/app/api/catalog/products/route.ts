import { NextResponse } from "next/server";
import { createCatalogStore } from "@/lib/catalog-core.mjs";
import { searchPublicProducts } from "@/lib/vietnamese-search-core.mjs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const after = url.searchParams.get("after") ?? undefined;
  const store = await createCatalogStore();
  try {
    return NextResponse.json({ products: await searchPublicProducts(store, { category, q, limit, after }) });
  } finally {
    await store.close();
  }
}
