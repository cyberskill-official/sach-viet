import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createInstitutionBuyerStore, submitInstitutionPurchaseOrder } from "@/lib/institution-buyer-core.mjs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await request.json();
    const store = await createInstitutionBuyerStore();
    try {
      return NextResponse.json({
        submission: await submitInstitutionPurchaseOrder(store, auth.user, {
          ...body,
          orderId: id,
        }),
      }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Purchase order submission failed." }, { status: 400 });
  }
}
