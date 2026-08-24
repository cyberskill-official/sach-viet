import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { attachArtifact, createB2bOrderStore, getStaffOrder, transitionOrderStatus } from "@/lib/b2b-order-core.mjs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const store = await createB2bOrderStore();
    try {
      return NextResponse.json({ order: await getStaffOrder(store, auth.user, id) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order is unavailable." }, { status: 403 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await request.json();
    const store = await createB2bOrderStore();
    try {
      if (body?.artifact) {
        return NextResponse.json({
          order: await attachArtifact(store, auth.user, {
            orderId: id,
            kind: body.artifact.kind,
            referenceNumber: body.artifact.referenceNumber,
            storageKey: body.artifact.storageKey,
          }),
        });
      }
      return NextResponse.json({ order: await transitionOrderStatus(store, auth.user, { orderId: id, status: body?.status }) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order update failed." }, { status: 400 });
  }
}
