import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createAdminCatalogStore, createAdminProduct, listAdminProducts } from "@/lib/admin-catalog-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const category = new URL(request.url).searchParams.get("category") ?? undefined;
    const store = await createAdminCatalogStore();
    try {
      return NextResponse.json({ products: await listAdminProducts(store, auth.user, { category }) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Products are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid product request." }, { status: 400 });
    const store = await createAdminCatalogStore();
    try {
      return NextResponse.json(await createAdminProduct(store, auth.user, body), { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Product creation failed.";
    const status = /Administrator/i.test(message) ? 403 : /required|cannot contain|valid category/i.test(message) ? 400 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
