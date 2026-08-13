import { NextResponse } from "next/server";
import { createCatalogStore } from "@/lib/catalog-core.mjs";
import { suggestCatalogQueries } from "@/lib/vietnamese-search-core.mjs";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const store = await createCatalogStore();
  try {
    return NextResponse.json({ suggestions: await suggestCatalogQueries(store, { q }) });
  } finally {
    await store.close();
  }
}
