import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createB2bOrderStore, getInstitutionOrder } from "@/lib/b2b-order-core.mjs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const store = await createB2bOrderStore();
    try {
      return NextResponse.json({ order: await getInstitutionOrder(store, auth.user, id) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order is unavailable." }, { status: 403 });
  }
}
