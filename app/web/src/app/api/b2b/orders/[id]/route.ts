import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { attachArtifact, createB2bOrderStore, getStaffOrder, transitionOrderStatus } from "@/lib/b2b-order-core.mjs";

function sessionFor(request: Request) {
  return readSession(getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const store = createB2bOrderStore();
    try {
      return NextResponse.json({ order: getStaffOrder(store, session.user, id) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order is unavailable." }, { status: 403 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json();
    const store = createB2bOrderStore();
    try {
      if (body?.artifact) {
        return NextResponse.json({
          order: attachArtifact(store, session.user, {
            orderId: id,
            kind: body.artifact.kind,
            referenceNumber: body.artifact.referenceNumber,
            storageKey: body.artifact.storageKey,
          }),
        });
      }
      return NextResponse.json({ order: transitionOrderStatus(store, session.user, { orderId: id, status: body?.status }) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order update failed." }, { status: 400 });
  }
}
