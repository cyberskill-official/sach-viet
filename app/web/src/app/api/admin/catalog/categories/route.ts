import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createAdminCatalogStore, createAdminCategory, listAdminCategories } from "@/lib/admin-catalog-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createAdminCatalogStore();
    try {
      return NextResponse.json({ categories: await listAdminCategories(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Categories are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid category request." }, { status: 400 });
    const store = await createAdminCatalogStore();
    try {
      return NextResponse.json({ category: await createAdminCategory(store, auth.user, body) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Category creation failed.";
    const status = /required|Administrator/i.test(message) ? (/Administrator/i.test(message) ? 403 : 400) : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
