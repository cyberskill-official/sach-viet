import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createInstitutionBuyerStore, getInstitutionMarcRecord } from "@/lib/institution-buyer-core.mjs";

export async function GET(request: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { productId } = await context.params;
    const store = await createInstitutionBuyerStore();
    try {
      return NextResponse.json({ marcRecord: await getInstitutionMarcRecord(store, auth.user, productId) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "MARC record is unavailable." }, { status: 403 });
  }
}
