import { NextResponse } from "next/server";
import { createCatalogStore, getPublicProduct } from "@/lib/catalog-core.mjs";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const store = await createCatalogStore();
  try {
    const product = await getPublicProduct(store, (await params).slug);
    return product ? NextResponse.json({ product }) : NextResponse.json({ error: "Product not found." }, { status: 404 });
  } finally {
    await store.close();
  }
}
