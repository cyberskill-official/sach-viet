import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createGoodsRequest, createSupportStore, listGoodsRequests } from "@/lib/support-core.mjs";

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createSupportStore();
    try { return NextResponse.json({ goodsRequest: await createGoodsRequest(store, auth.user, await request.json()) }, { status: 201 }); } finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Goods request could not be created." }, { status: 400 }); }
}
